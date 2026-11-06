import {env} from 'cloudflare:workers';
import {advance,fillPracticeSeats,joinRoom,lockAction,markTyping,newRoom,pickNumbers,project,rematch,sendChat,startMatch,type PlayerAction,type Room} from '@/lib/game';
export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
async function hash(value:string){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');}
function roomCode(){const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',bytes=crypto.getRandomValues(new Uint8Array(6));return [...bytes].map(x=>alphabet[x%alphabet.length]).join('');}
async function ensureProfile(db:any,key:string,name:string,now:number){const clean=String(name||'PLAYER').trim().slice(0,16)||'PLAYER';await db.prepare('INSERT INTO profiles (profile_id,display_name,public,created_at,updated_at) VALUES (?,?,1,?,?) ON CONFLICT(profile_id) DO UPDATE SET display_name=excluded.display_name,updated_at=excluded.updated_at').bind(key,clean,now,now).run();return key;}
async function stats(db:any,key:string){
 const scores=await db.prepare(`SELECT p.display_name name,COUNT(*) games,SUM(mp.won) wins,SUM(mp.hits) hits,SUM(mp.shots) shots FROM match_players mp JOIN matches m ON m.match_id=mp.match_id JOIN profiles p ON p.profile_id=mp.profile_id WHERE m.practice=0 AND p.public=1 GROUP BY mp.profile_id ORDER BY wins DESC,hits DESC LIMIT 20`).all();
 const hot=await db.prepare('SELECT grid_size,number,chosen,survived,called,hits FROM number_stats ORDER BY hits DESC,chosen DESC LIMIT 40').all();
 const clutch=await db.prepare(`SELECT c.kind,c.round,c.detail,c.created_at,p.display_name name FROM clutch_plays c JOIN profiles p ON p.profile_id=c.profile_id JOIN matches m ON m.match_id=c.match_id WHERE p.public=1 AND m.practice=0 ORDER BY c.created_at DESC LIMIT 20`).all();
 const mine=await db.prepare(`SELECT p.display_name name,p.public,COUNT(mp.match_id) games,COALESCE(SUM(mp.won),0) wins,COALESCE(SUM(mp.hits),0) hits,COALESCE(SUM(mp.shots),0) shots,COALESCE(SUM(mp.numbers_lost),0) numbersLost FROM profiles p LEFT JOIN match_players mp ON mp.profile_id=p.profile_id WHERE p.profile_id=? GROUP BY p.profile_id`).bind(key).first();
 const recent=await db.prepare(`SELECT m.finished_at,m.practice,m.rounds,mp.won,mp.hits,mp.shots FROM match_players mp JOIN matches m ON m.match_id=mp.match_id WHERE mp.profile_id=? ORDER BY m.finished_at DESC LIMIT 10`).bind(key).all();
 return{scores:scores.results||[],hot:hot.results||[],clutch:clutch.results||[],mine:mine||null,recent:recent.results||[]};
}
async function recordStats(db:any,g:Room){if(g.statsRecorded||g.phase!=='ended'||!g.matchId)return;if(g.tutorial){g.statsRecorded=true;return}const exists=await db.prepare('SELECT match_id FROM matches WHERE match_id=?').bind(g.matchId).first();if(exists){g.statsRecorded=true;return}const humans=g.players.filter(p=>!p.isBot&&p.profileId);const statements:any[]=[db.prepare('INSERT INTO matches (match_id,room_code,practice,finished_at,rounds,seats) VALUES (?,?,?,?,?,?)').bind(g.matchId,g.code,g.practice?1:0,g.endedAt||Date.now(),g.round,g.players.length)];
 for(const [seat,p] of g.players.entries()){if(p.isBot||!p.profileId)continue;const powers={doubleShot:2-p.powers.doubleShot,bomb:!p.powers.bomb,invincible:!p.powers.invincible,radar:!p.powers.radar};statements.push(db.prepare('INSERT INTO match_players (match_id,profile_id,seat,won,hits,shots,numbers_lost,picks,powers_used) VALUES (?,?,?,?,?,?,?,?,?)').bind(g.matchId,p.profileId,seat,g.winnerIds.includes(p.id)?1:0,p.hits,p.shots,p.dead.length,JSON.stringify(p.picks),JSON.stringify(powers)));for(const n of p.picks)statements.push(db.prepare('INSERT INTO number_stats (grid_size,number,chosen,survived,called,hits) VALUES (?,?,1,?,0,0) ON CONFLICT(grid_size,number) DO UPDATE SET chosen=chosen+1,survived=survived+excluded.survived').bind(g.gridSize,n,p.dead.includes(n)?0:1));if(g.winnerIds.includes(p.id)&&p.dead.length===2)statements.push(db.prepare('INSERT INTO clutch_plays (id,match_id,profile_id,kind,round,detail,created_at) VALUES (?,?,?,?,?,?,?)').bind(crypto.randomUUID(),g.matchId,p.profileId,'LAST LIFE',g.round,'Won with one hidden number left',g.endedAt||Date.now()));if(p.shots>=5&&p.hits/p.shots>=.7)statements.push(db.prepare('INSERT INTO clutch_plays (id,match_id,profile_id,kind,round,detail,created_at) VALUES (?,?,?,?,?,?,?)').bind(crypto.randomUUID(),g.matchId,p.profileId,'SHARPSHOOTER',g.round,`${p.hits}/${p.shots} shots hit`,g.endedAt||Date.now()));}
 for(const c of g.callStats||[])if(!c.byBot)statements.push(db.prepare('INSERT INTO number_stats (grid_size,number,chosen,survived,called,hits) VALUES (?,?,0,0,1,?) ON CONFLICT(grid_size,number) DO UPDATE SET called=called+1,hits=hits+excluded.hits').bind(g.gridSize,c.number,c.hit?1:0));if(humans.length)await db.batch(statements);g.statsRecorded=true;}
export async function POST(request:Request){try{
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return json({error:'This request must come from BoomGrid.'},403);
 const raw=await request.text();if(raw.length>8000)return json({error:'Request too large.'},413);const a=JSON.parse(raw||'{}');
 const token=request.headers.get('x-seat-token')||'';if(!/^[A-Za-z0-9_-]{32,128}$/.test(token))return json({error:'Your browser seat is missing. Reload to reconnect.'},401);
 if(!env.DB)return json({error:'The game database is not connected yet.'},503);const key=await hash(token),now=Date.now(),db=env.DB.withSession('first-primary');
 if(a.type==='stats')return json(await stats(db,key));
 if(a.type==='profile'){await ensureProfile(db,key,String(a.name||''),now);if(typeof a.public==='boolean')await db.prepare('UPDATE profiles SET public=?,updated_at=? WHERE profile_id=?').bind(a.public?1:0,now,key).run();return json(await stats(db,key));}
 if(a.type==='create'){const name=String(a.name||'').trim();await ensureProfile(db,key,name,now);for(let n=0;n<5;n++){const code=roomCode(),g=newRoom(code,name,key,!!a.practice,now,key,!!a.tutorial);if(g.practice)fillPracticeSeats(g,g.hostId,Number(a.seats)||6);const result=await db.prepare('INSERT OR IGNORE INTO rooms (code,state,revision,updated_at,phase) VALUES (?,?,0,?,?)').bind(code,JSON.stringify(g),now,g.phase).run();if(result.meta.changes)return json(project(g,g.hostId,now));}throw new Error('Could not reserve a room. Please try again.');}
 const code=String(a.code||'').trim().toUpperCase();if(!/^[A-Z2-9]{6}$/.test(code))return json({error:'Enter a six-character room code.'},400);
 for(let attempt=0;attempt<8;attempt++){
  const row=await db.prepare('SELECT state,revision FROM rooms WHERE code=?').bind(code).first<{state:string;revision:number}>();if(!row)return json({error:'That room could not be found. Check the code.'},404);
  const g=JSON.parse(row.state) as Room;g.revision=row.revision;const beforeAdvance=JSON.stringify(g);advance(g,now);const advanced=JSON.stringify(g)!==beforeAdvance;let p=g.players.find(x=>x.seatKeyHash===key);
  if(a.type==='join'){const name=String(a.name||'').trim();await ensureProfile(db,key,name,now);p=joinRoom(g,name,key,key);}
  if(!p)return json({error:'You do not have a seat in this room. Join from the start screen.'},403);
  if(a.type==='poll'&&!advanced)return json(project(g,p.id,now));
  if(!['poll','join'].includes(a.type)){
   const receipt=String(a.requestId||'');if(!receipt||receipt.length>100)throw new Error('Missing action receipt. Please try again.');
   if(!g.requestIds.includes(receipt)){
    if(a.type==='start')startMatch(g,p.id,now);
    else if(a.type==='pick')pickNumbers(g,p.id,a.numbers,now);
    else if(a.type==='act')lockAction(g,p.id,a.action as PlayerAction,now);
    else if(a.type==='chat')sendChat(g,p.id,a.message,now);
    else if(a.type==='typing')markTyping(g,p.id,now);
    else if(a.type==='rematch')rematch(g,p.id,now);
    else throw new Error('Unknown game action.');
    g.requestIds.push(receipt);g.requestIds=g.requestIds.slice(-100);
   }
  }
  g.revision=row.revision+1;const updated=await db.prepare('UPDATE rooms SET state=?,revision=revision+1,updated_at=?,phase=? WHERE code=? AND revision=?').bind(JSON.stringify(g),now,g.phase,code,row.revision).run();
  if(updated.meta.changes){if(g.phase==='ended'&&!g.statsRecorded){await recordStats(db,g);await db.prepare('UPDATE rooms SET state=? WHERE code=? AND revision=?').bind(JSON.stringify(g),code,g.revision).run();}return json(project(g,p.id,now));}
 }
 return json({error:'The grid is busy. Try that action again.'},409);
}catch(error){return json({error:error instanceof Error?error.message:'BoomGrid could not process that action.'},400);}}

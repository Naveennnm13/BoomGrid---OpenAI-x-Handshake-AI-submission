'use client';
import {useEffect,useRef,useState} from 'react';
import {Bomb,Crosshair,Heart,MessageSquare,ScanLine,Shield,X,Zap} from 'lucide-react';
import {GameGrid} from './game-grid';
const steps=[
 {target:'own',title:'Hide your three lives',text:'Tap any 3 numbers on your board. These are your lives. Other players cannot see them.'},
 {target:'opponents',title:'Choose who to hunt',text:'Tap PIXEL or NOVA. Each opponent has a separate board. The hearts show how many hidden numbers remain.'},
 {target:'target',title:'Pick a number',text:'Tap a number on the opponent’s grid to aim. You can change your selection before firing.'},
 {target:'fire',title:'Lock in your shot',text:'Press Fire below. Your shot resolves before the next player takes a turn. If your timer runs out, the game chooses an attack for you.'},
 {target:'target',title:'Watch the impact',text:'This training shot is a guaranteed hit. A red X marks a destroyed life; charcoal ash marks a miss. The result appears before the next turn.'},
 {target:'lives',title:'Protect your last heart',text:'Every hit costs one life. Lose all 3 and you are out. Be the last player with a hidden number to win.'},
 {target:'double',title:'Double Shot',text:'Call 2 different numbers on one opponent’s board. You have 2 uses per match. You can use only one power-up in a round.'},
 {target:'bomb',title:'Suicide Bomb',text:'Trade one of your live numbers for one of theirs. You need at least 2 lives. An invincible target blocks it and refunds your sacrifice.'},
 {target:'shield',title:'Invincibility',text:'Block attacks until your next turn, including bombs and Radar. You skip your attack to raise the shield. Use this power once per match.'},
 {target:'radar',title:'Radar',text:'Privately count live numbers in one row or column. The reading stays on your board view. You get one scan per match.'},
 {target:'highlights',title:'Read the round',text:'Follow attacks in the highlights. After the round, only hits and power-ups remain in the recap. Then the next surviving player takes a turn.'},
 {target:'chat',title:'Talk at the table',text:'Room chat shows who is typing. Keep it friendly: no abuse, links or contact information. You are ready for a practice match.'},
];
export function GameTutorial({close,complete}:{close:()=>void;complete:()=>void}){
 const [step,setStep]=useState(0),[picks,setPicks]=useState<number[]>([]),[opponent,setOpponent]=useState(''),[aim,setAim]=useState<number|null>(null),[fired,setFired]=useState(false);
 const root=useRef<HTMLDivElement>(null),card=useRef<HTMLElement>(null);
 const current=steps[step];
 useEffect(()=>{const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=old}},[]);
 useEffect(()=>{root.current?.querySelector('[data-lit="true"]')?.scrollIntoView({block:'center',behavior:'instant'});card.current?.focus({preventScroll:true})},[step]);
 function lit(id:string){return {'data-lit':current.target===id?'true':'false'}}
 const ready=step===0?picks.length===3:step===1?!!opponent:step===2?aim!==null:step===3?fired:true;
 function keys(e:React.KeyboardEvent){if(e.key==='Escape'){e.preventDefault();close()}if(e.key==='Tab'){const all=[...root.current!.querySelectorAll<HTMLElement>('button:not(:disabled),[tabindex="0"]')].filter(el=>el.getClientRects().length);const first=all[0],last=all.at(-1);if(e.shiftKey&&(document.activeElement===first||document.activeElement===card.current)){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}}
 return <div className="game-tutorial game-shell" ref={root} onKeyDown={keys} role="dialog" aria-modal="true" aria-labelledby="lesson-title">
 <div className="lesson-stage">
 <header className="lesson-header"><b>BOOMGRID / TRAINING</b><span>NO TIMER · NO STATS</span></header>
 <div className="lesson-layout">
 <section className="own-panel lesson-own" {...lit('own')}><h2>Your secret board</h2><div className="lives" {...lit('lives')}>{[0,1,2].map(n=><Heart key={n}/>)}</div><GameGrid size={25} rows={5} picks={picks} selected={picks} disabled={step!==0} onCell={n=>setPicks(v=>v.includes(n)?v.filter(x=>x!==n):v.length<3?[...v,n]:v)}/><p>{picks.length}/3 hidden</p></section>
 <section className="target-panel" {...lit('target')}><div className="target-head"><span>{opponent||'Choose a target'}</span><small>{fired?2:3} lives</small></div><GameGrid size={25} rows={5} selected={aim!==null&&!fired?[aim]:[]} called={fired&&aim!==null?{[aim]:'hit',[aim===25?24:25]:'miss'}:{}} blast={step===4?aim:null} blastKey={step} disabled={step!==2} onCell={n=>{setAim(n);setFired(false)}} radar={step===9?{axis:'row',index:1,count:1,round:1}:undefined}/></section>
 <aside className="lesson-rail"><section className="opponents" {...lit('opponents')}><h2>Opponents</h2>{['PIXEL','NOVA'].map(name=><button key={name} disabled={step!==1} onClick={()=>setOpponent(name)} className={opponent===name?'selected':''}><span>{name}</span><span/><small>3 ♥</small></button>)}</section>
 <section className="round-highlights compact" {...lit('highlights')}><header>ROUND 1 HIGHLIGHTS</header><div><article className="hit"><Crosshair/><span><b>HIT</b>You → {opponent||'PIXEL'} · #{aim||7}</span></article><article className="shield"><Shield/><span><b>INVINCIBLE</b>NOVA raised a shield</span></article></div></section>
 <section className="table-chat" {...lit('chat')}><header><span><MessageSquare/>TABLE CHAT</span></header><div className="chat-log"><p><b>PIXEL</b><span>Nice shot. My turn next!</span></p></div><div className="typing-line">NOVA is typing…</div><p className="chat-rules">TRAINING EXAMPLE · NO LINKS · NO HARASSMENT</p></section></aside>
 </div>
 <div className="lesson-controls">{[{id:'double',name:'Double Shot',icon:<Zap/>,count:'2 uses'},{id:'bomb',name:'Suicide Bomb',icon:<Bomb/>,count:'1 use'},{id:'shield',name:'Invincible',icon:<Shield/>,count:'1 use'},{id:'radar',name:'Radar',icon:<ScanLine/>,count:'1 use'}].map(p=><div key={p.id} className="power-button" {...lit(p.id)}>{p.icon}<span>{p.name}</span><small>{p.count}</small></div>)}<button className="fire-button" {...lit('fire')} disabled={step!==3||aim===null||fired} onClick={()=>{setFired(true);setStep(4)}}>Fire at {aim??'—'}</button></div>
 </div>
 <div className="lesson-shade" aria-hidden="true"/>
 <section className="lesson-card" tabIndex={-1} ref={card}><button className="lesson-close" aria-label="Close tutorial" onClick={close}><X/></button><span className="eyebrow">HOW TO PLAY · {step+1}/{step<6?6:steps.length}</span><h2 id="lesson-title">{current.title}</h2><p>{current.text}</p><nav><button onClick={()=>setStep(v=>Math.max(0,v-1))} disabled={step===0}>Back</button><button onClick={close}>Exit tour</button>{step===5&&<button onClick={()=>setStep(6)}>Learn power-ups</button>}<button className="lesson-next" disabled={!ready} onClick={()=>step===5||step===steps.length-1?complete():setStep(v=>v+1)}>{step===5||step===steps.length-1?'Start practice':!ready?(step===0?'Pick 3 numbers':step===1?'Choose a player':step===2?'Aim at a number':'Press Fire'):'Next'}</button></nav></section>
 </div>
}

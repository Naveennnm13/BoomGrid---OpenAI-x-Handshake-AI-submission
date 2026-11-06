export type Cue='lock'|'tick'|'miss'|'hit'|'double'|'bomb'|'shield'|'radar'|'deflect'|'out'|'win';
export class GameAudio {
 ctx:AudioContext|null=null;
 muted=true;
 private output:GainNode|null=null;
 private noise:AudioBuffer|null=null;
 private musicGain:GainNode|null=null;
 private musicTimer:ReturnType<typeof setInterval>|null=null;
 private nextBeat=0;
 private beat=0;
 get musicPlaying(){return this.musicTimer!==null}
 startMusic(){
  if(!this.ctx||!this.output||this.musicTimer)return;
  const ctx=this.ctx;if(!this.musicGain){this.musicGain=ctx.createGain();this.musicGain.connect(this.output)}this.musicGain.gain.setValueAtTime(.7,ctx.currentTime);
  this.nextBeat=ctx.currentTime+.04;this.beat=0;
  const schedule=()=>{if(!this.ctx||!this.musicGain)return;while(this.nextBeat<this.ctx.currentTime+.35){this.musicBeat(this.nextBeat,this.beat++);this.nextBeat+=60/144/2}};
  schedule();this.musicTimer=setInterval(schedule,100);
 }
 stopMusic(){if(this.musicTimer)clearInterval(this.musicTimer);this.musicTimer=null;if(this.ctx&&this.musicGain)this.musicGain.gain.setTargetAtTime(0,this.ctx.currentTime,.03)}
 private musicBeat(at:number,beat:number){
  const ctx=this.ctx!,output=this.musicGain!,step=beat%16;
  const note=(f:number,duration:number,volume:number,type:OscillatorType='sawtooth',start=at)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f,start);g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(volume,start+.012);g.gain.exponentialRampToValueAtTime(.0001,start+duration);o.connect(g).connect(output);o.start(start);o.stop(start+duration+.01)};
  // Original arcade loop: square-wave bass, 8-bit snare and short chord stabs.
  const roots=[55,65.41,73.42,49],root=roots[Math.floor((beat%64)/16)];
  if(step%2===0){note(root, .19,.045,'square');note(root*2,.11,.009,'square')}
  if(step%4===0){const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.setValueAtTime(110,at);o.frequency.exponentialRampToValueAtTime(38,at+.18);g.gain.setValueAtTime(.19,at);g.gain.exponentialRampToValueAtTime(.0001,at+.2);o.connect(g).connect(output);o.start(at);o.stop(at+.21)}
  if(step%4===2){const duration=.12,buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/(ctx.sampleRate*.025));const source=ctx.createBufferSource(),g=ctx.createGain();source.buffer=buffer;g.gain.value=.13;source.connect(g).connect(output);source.start(at)}
  if(step%8===0){[1,1.2,1.5].forEach((ratio,i)=>note(root*4*ratio,.28,.008,'square',at+i*.014))}
 }

 async enable(){
  this.ctx??=new AudioContext();
  if(!this.output){this.output=this.ctx.createGain();this.output.connect(this.ctx.destination)}
  await this.ctx.resume();this.muted=false;this.output.gain.setValueAtTime(1,this.ctx.currentTime);return true;
 }
 mute(){this.stopMusic();this.muted=true;if(this.ctx&&this.output)this.output.gain.setValueAtTime(0,this.ctx.currentTime)}
 cue(c:Cue,count=1){
  if(this.muted||!this.ctx||!this.output)return;
  const ctx=this.ctx,now=ctx.currentTime;
  if(c==='bomb'){
   // A sharp noise burst and falling bass give the blast a crack and a rumble.
   if(!this.noise){this.noise=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.42),ctx.sampleRate);const data=this.noise.getChannelData(0);for(let i=0;i<data.length;i+=12){const v=Math.random()>.5?1:-1;data.fill(v,i,Math.min(i+12,data.length))}}
   const burst=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),envelope=ctx.createGain();
   burst.buffer=this.noise;filter.type='bandpass';filter.Q.value=.6;filter.frequency.setValueAtTime(2300,now);filter.frequency.exponentialRampToValueAtTime(180,now+.4);
   envelope.gain.setValueAtTime(.24,now);envelope.gain.exponentialRampToValueAtTime(.001,now+.42);
   burst.connect(filter).connect(envelope).connect(this.output);burst.start(now);burst.stop(now+.42);
   const bass=ctx.createOscillator(),thump=ctx.createGain();bass.type='square';bass.frequency.setValueAtTime(180,now);bass.frequency.exponentialRampToValueAtTime(45,now+.28);thump.gain.setValueAtTime(.08,now);thump.gain.exponentialRampToValueAtTime(.001,now+.3);bass.connect(thump).connect(this.output);bass.start(now);bass.stop(now+.31);return;
  }
  const tones:Record<Exclude<Cue,'bomb'>,number[]>={lock:[880],tick:[260],miss:[240,180],hit:[760,1040],double:[700,900],shield:[560,720,900],radar:[300,500],deflect:[1200],out:[500,390,280,180],win:[523,659,784,1046]};
  tones[c].forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=i%2?'triangle':'square';o.frequency.setValueAtTime(f,now+i*.09);g.gain.setValueAtTime(.035,now+i*.09);g.gain.exponentialRampToValueAtTime(.001,now+i*.09+.12);o.connect(g).connect(this.output!);o.start(now+i*.09);o.stop(now+i*.09+.13)});
  if(c==='radar')for(let i=0;i<count;i++)setTimeout(()=>this.cue('lock'),180+i*90);
 }
}

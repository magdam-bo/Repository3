(()=>{'use strict';
const SAVE_KEY='cageCathedral.prototype.v1';
const CATHEDRAL={width:480,height:512,rusai:{x:256,y:282},chandelier:{x:256,y:195},shelf:{x:414,y:161},altar:{x:256,y:112},door:{x:456,y:328}};
const PEWS=[196,312,390].flatMap(y=>[68,316].map(x=>({x,y,w:96,h:20})));
const PILLARS=[160,272,384].flatMap(y=>[40,440].map(x=>({x,y})));
const hit=(x,y,left,top,right,bottom)=>x>left&&x<right&&y>top&&y<bottom;
const fresh=()=>({version:2,room:'cathedral',x:221,y:282,dir:'right',items:[],flags:{started:true,rusaiState:0,hintRead:false,shelfOpen:false,deskOpen:false,keyTaken:false,wireTaken:false,visitedSide:false}});
let data=fresh(),scene,dialogue=null,dialogIndex=0,pin='',lastMove=0;
const $=id=>document.getElementById(id),hide=e=>e.classList.add('hidden'),show=e=>e.classList.remove('hidden');
const say=(speaker,lines)=>{dialogue={speaker,lines};dialogIndex=0;$('speaker').textContent=speaker;$('line').textContent=lines[0];show($('dialog'))};
const next=()=>{if(!dialogue)return false;dialogIndex++;if(dialogIndex>=dialogue.lines.length){dialogue=null;hide($('dialog'))}else $('line').textContent=dialogue.lines[dialogIndex];return true};
const itemData={iron_key:{id:'iron_key',name:'鉄の鍵',description:'小部屋の机の引き出しに合いそうだ。',target:'desk',consume:true},wire:{id:'wire',name:'曲がった針金',description:'細く曲がった針金。鎖の留め具に届くかもしれない。',target:'rusai',consume:true}};
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(data));toast('セーブしました')}catch{toast('セーブできませんでした')}}
function restore(){data=fresh();try{
 const s=JSON.parse(localStorage.getItem(SAVE_KEY));
 if(!s||!['cathedral','side'].includes(s.room)||!Number.isFinite(s.x)||!Number.isFinite(s.y)||!['up','down','left','right'].includes(s.dir)||!Array.isArray(s.items)||!s.flags||typeof s.flags!=='object')return;
 data.room=s.room;
 if(s.room==='cathedral'){
  if(s.version===2){data.x=Math.max(26,Math.min(454,s.x));data.y=Math.max(40,Math.min(486,s.y))}
  else {data.x=Math.max(27,Math.min(450,s.x+96));data.y=Math.max(40,Math.min(486,s.y+110));if(s.x>265&&s.y>155){data.x=438;data.y=328}}
 }else{data.x=Math.max(23,Math.min(299,s.x));data.y=Math.max(39,Math.min(218,s.y))}
 data.dir=s.dir;data.items=s.items.filter(id=>id==='iron_key'||id==='wire');
 for(const key of ['started','hintRead','shelfOpen','visitedSide','deskOpen','keyTaken','wireTaken'])data.flags[key]=s.flags[key]===true;
 data.flags.rusaiState=[0,1,2].includes(s.flags.rusaiState)?s.flags.rusaiState:0;
 data.flags.deskOpen ||= s.flags.doorOpen===true || (s.flags.shelfOpen===true && s.flags.visitedSide===true && !data.items.includes('iron_key'));
 data.flags.keyTaken ||= data.flags.deskOpen || data.items.includes('iron_key');data.flags.wireTaken ||= data.items.includes('wire');
 // If an old save lands in new architecture, shift it to the clear central aisle.
 if(s.room==='cathedral'&&cathedralBlocked(data.x,data.y)){data.x=256;data.y=302}
 }catch{data=fresh()}}

function toast(t){$('toast').textContent=t;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('toast').textContent='矢印キー / WASD で移動',2200)}
function showItems(){if(!$('title').classList.contains('hidden'))return;const lines=data.items.length?data.items.map(id=>`<div><b>${itemData[id].name}</b><br><small>${itemData[id].description}</small><br><button data-use="${id}">使う</button></div>`).join('<hr>'):'持ち物はありません。';$('modal-title').textContent='持ち物';$('modal-content').innerHTML=lines;$('modal-content').querySelectorAll('[data-use]').forEach(b=>b.onclick=()=>{const id=b.dataset.use;useItem(id,itemData[id].target)});show($('modal'));}
function enterSide(){data.room='side';data.x=38;data.y=188;data.dir='right';data.flags.visitedSide=true;scene.renderMap();save()}
function leaveSide(){data.room='cathedral';data.x=433;data.y=328;data.dir='left';scene.renderMap();save()}
function useItem(id,target){if(!data.items.includes(id)||!itemData[id])return;const consume=()=>{if(itemData[id].consume)data.items=data.items.filter(x=>x!==id)};if(target==='desk'&&id==='iron_key'&&data.room==='side'&&near(189,120,40)){consume();data.flags.deskOpen=true;closeModal();say('エックス',['鉄の鍵が小さな錠に合った。机の引き出しが開く。']);save();return}if(target==='rusai'&&id==='wire'&&data.room==='cathedral'&&near(256,274,36)&&data.flags.rusaiState===1){data.flags.rusaiState=2;consume();closeModal();scene.renderMap();say('エックス',['針金を留め具に差し込み、慎重にひねる。','小さな音とともに鎖がほどけた。ルサイは、まだ立ち上がれない。']);save();return}closeModal();say('エックス',['ここでは使えないようだ。対象の近くで使おう。'])}
function closeModal(){hide($('modal'))}
function near(tx,ty,r=24){const dx=({up:0,down:0,left:-1,right:1})[data.dir],dy=({up:-1,down:1,left:0,right:0})[data.dir];return Math.hypot(data.x+dx*18-tx,data.y+dy*18-ty)<r}
function interact(){if(!$('title').classList.contains('hidden'))return;if(dialogue){next();return}if(!$('pin-modal').classList.contains('hidden'))return;if(!$('modal').classList.contains('hidden'))return;
 if(data.room==='cathedral'){
  if(near(256,274,36)){if(data.flags.rusaiState===0){data.flags.rusaiState=1;scene.renderMap();say('エックス',['「ルサイ。聞こえるか？」','まぶたがかすかに動いた。鎖につながれたまま、ルサイが目を覚ます。']);save()}else if(data.flags.rusaiState===1){say('ルサイ',['「……エックス、くん……？」','声は弱い。手首の鎖が、石の床に伸びている。']);}else say('エックス',['ルサイはまだ力が戻らない。ここから出る方法を探そう。']);return}
  if(near(414,162,35)){if(data.flags.shelfOpen){if(!data.flags.keyTaken){data.flags.keyTaken=true;data.items.push('iron_key');say('エックス',['棚の奥から、古びた鉄の鍵を見つけた。']);save()}else say('エックス',['棚は空になっている。'])}else openPin();return}
  if(near(256,112,43)){say('エックス',['祭壇には、蝋燭が二本残されている。火はすべて消えていた。']);return}
  if(near(256,195,31)){say('エックス',['天井から巨大なシャンデリアが吊られている。鎖がきしみ、暗がりに音が吸い込まれた。']);return}
  if(near(457,328,34)){enterSide();return}
  say('エックス',['石造りの大聖堂。古い長椅子と、埃をかぶった祭壇が見える。']);return;
 }
 if(near(72,110,38)){data.flags.hintRead=true;say('書類',['端の破れた紙片が机に残っている。','「聖堂の蝋燭の数を、天使の数のあとに続けて記す」','試作用の暗証番号は 1842。正式な謎解きは後から差し替えられる。']);save();return}
 if(near(189,120,40)){if(!data.flags.deskOpen){if(data.items.includes('iron_key'))useItem('iron_key','desk');else say('エックス',['机の引き出しは施錠されている。']);}else if(!data.flags.wireTaken){data.flags.wireTaken=true;data.items.push('wire');say('エックス',['机の引き出しに、細い針金が入っていた。']);save()}else say('エックス',['机の上には、乾いたインク壺と古い帳面がある。']);return}
 if(near(25,186,30)){leaveSide();return}
 say('エックス',['小部屋には書類と古い机がある。']);
}
function openPin(){pin='';$('pin-display').textContent='・・・・';show($('pin-modal'))}
function submitPin(){if(pin.length<4){toast('4桁を入力してください');return}if(pin==='1842'){data.flags.shelfOpen=true;hide($('pin-modal'));scene.renderMap();say('エックス',['錠が低く鳴って外れた。棚の扉が開く。']);save()}else{pin='';$('pin-display').textContent='・・・・';toast('番号が違うようだ')}}
function addPinDigit(digit){if(pin.length<4){pin+=digit;$('pin-display').textContent=pin.padEnd(4,'・')}}
for(let i=1;i<=9;i++){const b=document.createElement('button');b.textContent=i;b.onclick=()=>addPinDigit(String(i));$('pin-pad').appendChild(b)}for(const [label,fn] of [['⌫',()=>{pin=pin.slice(0,-1);$('pin-display').textContent=pin.padEnd(4,'・')}],['0',()=>addPinDigit('0')],['決定',submitPin]]){const b=document.createElement('button');b.textContent=label;b.onclick=fn;$('pin-pad').appendChild(b)}
function confirmAction(){if(!$('pin-modal').classList.contains('hidden')){submitPin();return}interact()}
function backAction(){if(!$('pin-modal').classList.contains('hidden'))hide($('pin-modal'));else if(!$('modal').classList.contains('hidden'))closeModal();else if(dialogue)next();else showItems()}
$('pin-cancel').onclick=backAction;$('modal-close').onclick=closeModal;$('save').onclick=save;$('mobile-action').onclick=confirmAction;$('mobile-back').onclick=backAction;$('mobile-items').onclick=showItems;
$('start').onclick=()=>{data=fresh();hide($('title'));show($('mobile-pad'));scene.renderMap();say('エックス',['……ここはどこだ。','すぐそばに、鎖につながれたルサイが倒れている。']);};$('continue').onclick=()=>{restore();hide($('title'));show($('mobile-pad'));scene.renderMap()};
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.key==='Escape'||e.key.toLowerCase()==='x'){backAction();return}if(e.key.toLowerCase()==='i'){showItems();return}if(['z','Enter',' '].includes(e.key)){confirmAction();return}if(scene)scene.setKey(e.key,true)});
window.addEventListener('keyup',e=>{if(scene)scene.setKey(e.key,false)});
document.querySelectorAll('[data-dir]').forEach(b=>{let timer;const dir=b.dataset.dir;const move=()=>{if(scene)scene.move(dir)};b.addEventListener('pointerdown',e=>{e.preventDefault();move();timer=setInterval(move,75)});for(const ev of ['pointerup','pointerleave','pointercancel'])b.addEventListener(ev,()=>clearInterval(timer))});
// Each world coordinate is independent of the screen and of the fixed HTML controls.
function cathedralBlocked(x,y){
 if(x<26||x>457||y<43||y>486)return true;
 if(hit(x,y,183,78,327,139))return true; // altar platform and stone table
 if(hit(x,y,385,134,439,191))return true; // numbered cabinet
 for(const p of PEWS)if(hit(x,y,p.x-5,p.y-5,p.x+p.w+5,p.y+p.h+8))return true;
 for(const p of PILLARS)if(hit(x,y,p.x-15,p.y-4,p.x+15,p.y+14))return true;
 if(Math.hypot(x-256,y-282)<9)return true;
 return false;
}
function stone(g,x,y,w,h,top=0x696871,front=0x42434d){g.fillStyle(0x15171d,.8);g.fillRect(x+3,y+5,w,h);g.fillStyle(front);g.fillRect(x,y+4,w,h-4);g.fillStyle(top);g.fillRect(x,y,w,5);g.lineStyle(1,0x88838b,.55);g.strokeRect(x,y,w,h)}
function gothicWindow(g,x,y,w=32,h=60){
 g.fillStyle(0x151820);g.fillRect(x-4,y-5,w+8,h+12);g.fillStyle(0x73727a);g.fillRect(x-2,y+8,w+4,h-6);
 g.fillStyle(0x303645);g.fillRect(x+2,y+10,w-4,h-12);
 for(let i=0;i<4;i++){g.fillStyle([0x363e65,0x533e58,0x563842,0x39495d][i]);g.fillRect(x+3+(i%2)*(w-9)/2,y+11+Math.floor(i/2)*(h-15)/2,(w-10)/2,(h-16)/2)}
 g.fillStyle(0x807a88);g.fillRect(x+w/2-2,y+7,4,h-3);g.fillRect(x,y+h/2,w,3);
 g.fillStyle(0x777080);g.fillTriangle(x-3,y+12,x+w/2,y-9,x+w+3,y+12);g.fillStyle(0x302e3e);g.fillTriangle(x+3,y+10,x+w/2,y-4,x+w-3,y+10);
 g.fillStyle(0x495070,.09);g.fillTriangle(x,y+h,x+w,y+h,x+w+38,y+h+95);
}
function drawCathedral(g,flags){
 const {width:w,height:h}=CATHEDRAL;
 g.fillStyle(0x0e1018);g.fillRect(0,0,w,h);
 g.fillStyle(0x393a43);g.fillRect(16,24,w-32,h-44);
 // Large stone flagstones and a brighter, patterned central nave.
 for(let row=0;row<30;row++)for(let col=0;col<29;col++){
  const x=16+col*16+(row%2?0:-8),y=24+row*16;
  const aisle=x>=176&&x<304;
  g.fillStyle(aisle?((col+row)%4===0?0x41414e:0x3b3d49):((col+row)%5===0?0x3a3942:0x34363e));g.fillRect(x,y,16,16);
  g.lineStyle(1,aisle?0x585560:0x49474f,.45);g.strokeRect(x,y,16,16);
  if((row*13+col*7)%31===0){g.lineStyle(1,0x22252f,.7);g.lineBetween(x+4,y+6,x+9,y+5);g.lineBetween(x+9,y+5,x+11,y+10)}
 }
 g.fillStyle(0x514d58);g.fillRect(173,145,3,322);g.fillRect(303,145,3,322);
 for(let y=152;y<464;y+=32){g.lineStyle(1,0x716775,.6);g.strokeRect(230,y,52,16);g.lineBetween(256,y+2,256,y+14);g.lineBetween(231,y+8,281,y+8)}
 // Thick side walls, buttresses and recesses.
 stone(g,6,16,20,474,0x676572,0x33353f);stone(g,454,16,20,474,0x676572,0x33353f);
 stone(g,18,18,444,20,0x716e78,0x3f3e49);
 stone(g,18,477,444,18,0x6c6972,0x35343d);
 for(const y of [120,244,366]){g.fillStyle(0x222632);g.fillRect(24,y,10,66);g.fillRect(446,y,10,66);g.fillStyle(0x686470);g.fillRect(25,y,2,66);g.fillRect(453,y,2,66)}
 // Apse: stepped altar and window, with muted colored light.
 gothicWindow(g,221,39,70,72);
 g.fillStyle(0x48506b,.18);g.fillTriangle(237,110,291,110,350,213);
 stone(g,176,105,160,37,0x66626b,0x34343d);
 stone(g,185,113,142,18,0x78717a,0x45434e);
 stone(g,198,91,116,24,0x918677,0x57515a);
 g.fillStyle(0xb5a078);g.fillRect(206,77,3,17);g.fillRect(303,77,3,17);
 g.fillStyle(0x807052);g.fillRect(202,74,11,4);g.fillRect(299,74,11,4);
 g.fillStyle(0x5d5361);g.fillRect(230,91,52,17);g.fillStyle(0x999080);g.fillRect(254,93,4,13);
 g.fillStyle(0x595560);g.fillRect(188,140,136,4);g.fillRect(195,144,122,4);
 // Repeated wooden pews on both sides of the unobstructed central aisle.
 for(const p of PEWS){
  g.fillStyle(0x15161d,.75);g.fillRect(p.x+5,p.y+18,p.w,p.h+4);
  g.fillStyle(0x2b2425);g.fillRect(p.x,p.y-7,p.w,p.h+13);
  g.fillStyle(0x655044);g.fillRect(p.x+2,p.y-6,p.w-4,8);
  g.fillStyle(0x8a6a51);g.fillRect(p.x+4,p.y-6,p.w-8,2);
  g.fillStyle(0x493529);g.fillRect(p.x+4,p.y+6,p.w-8,12);
  g.fillStyle(0x79604a);g.fillRect(p.x+4,p.y+6,p.w-8,4);
  for(const x of [p.x+6,p.x+p.w-10]){g.fillStyle(0x251e20);g.fillRect(x,p.y+17,5,8)}
 }
 // Cabinet and door, both tied to existing interactions.
 stone(g,391,138,43,48,0x6b5d50,0x322d31);
 g.fillStyle(flags.shelfOpen?0x252831:0x67513e);g.fillRect(395,143,35,37);
 g.lineStyle(1,0x988266);g.strokeRect(395,143,35,37);
 for(let i=0;i<3;i++)g.lineBetween(399,151+i*9,425,151+i*9);
 g.fillStyle(0x161820);g.fillRect(454,306,20,47);g.fillStyle(0x716876);g.fillRect(453,304,2,51);g.fillRect(454,305,17,3);
 // South-facing pointed entrance is sealed by the iron birdcage gate.
 g.fillStyle(0x171923);g.fillRect(207,462,66,30);
 g.fillStyle(0x8b8181);g.fillTriangle(202,467,240,444,278,467);
 g.fillStyle(0x1d202a);g.fillTriangle(211,467,240,451,269,467);
 for(let x=215;x<268;x+=10){g.fillStyle(0x77747d);g.fillRect(x,463,2,26)}
 g.fillStyle(0x8b795b);g.fillRect(209,481,63,3);
 // Pillar shadows sit below the player; upper masonry is drawn in its own depth layer.
 for(const p of PILLARS){g.fillStyle(0x10121a,.65);g.fillRect(p.x-18,p.y+9,39,12)}
 // Large independent chandelier high above Rusa. It never overlaps the face.
 g.lineStyle(2,0x655f53);g.lineBetween(256,31,256,167);
 g.fillStyle(0x1d1c21);g.fillRect(233,174,46,3);
 g.lineStyle(2,0x70634e);g.lineBetween(256,167,228,193);g.lineBetween(256,167,284,193);
 g.lineBetween(228,193,284,193);g.lineBetween(235,187,277,187);
 for(const x of [225,237,249,261,273,285]){g.fillStyle(0x6b5d47);g.fillRect(x-3,192,6,4);g.fillStyle(0xb4a071);g.fillRect(x-1,186,2,5);g.fillStyle(0x998164);g.fillRect(x-2,184,4,2)}
 g.fillStyle(0x171822,.22);g.fillEllipse(256,282,72,15);
}
function drawPillar(g,x,y){
 g.fillStyle(0x262630);g.fillRect(x-12,y-45,24,54);
 g.fillStyle(0x77727b);g.fillRect(x-11,y-43,6,48);
 g.fillStyle(0x4b4954);g.fillRect(x-5,y-42,13,48);
 g.fillStyle(0x2a2b35);g.fillRect(x+8,y-42,4,49);
 stone(g,x-15,y-46,30,8,0x817b83,0x4d4b56);
 stone(g,x-16,y+1,32,11,0x77717a,0x3d3d49);
}
class CathedralScene extends Phaser.Scene {
 constructor(){super('cathedral-scene');this.keys={}}
 preload(){
  this.load.on('progress',value=>{$('load-status').textContent=`素材を読み込み中… ${Math.round(value*100)}%`});
  this.load.on('loaderror',file=>{$('load-status').textContent=`素材の読み込みに失敗しました：${file.key}。ページを再読み込みしてください。`});
  this.load.image('x-front-1','x-front-01.png');this.load.image('x-front-2','x-front-02.png');this.load.image('x-front-3','x-front-03.png');
  this.load.image('x-back-1','x-back-01.png');this.load.image('x-back-2','x-back-02.png');this.load.image('x-back-3','x-back-03.png');
  this.load.image('x-side-1','x-side-01.png');this.load.image('x-side-2','x-side-02.png');this.load.image('x-side-3','x-side-03.png');this.load.image('x-side-4','x-side-04.png');
  this.load.image('rusai-sleep','rusai-chained-unconscious.png?v=2');this.load.image('rusai-chain-awake','rusai-chained-awake.png?v=2');this.load.image('rusai-free','rusai-free-awake.png?v=2');
 }
 create(){scene=this;this.renderMap();$('start').disabled=false;$('start').textContent='はじめる';$('continue').disabled=false;$('load-status').textContent='準備ができました';this.time.addEvent({delay:130,loop:true,callback:()=>this.draw()})}
 renderMap(){
  $('room-name').textContent=data.room==='cathedral'?'大聖堂':'小部屋';
  if(this.player)this.player.destroy();if(this.rusai)this.rusai.destroy();if(this.arch)this.arch.forEach(shape=>shape.destroy());this.arch=[];if(this.worldLayer)this.worldLayer.destroy(true);
  this.worldLayer=this.add.container(0,0);const g=this.add.graphics();this.worldLayer.add(g);
  if(data.room==='cathedral'){
   drawCathedral(g,data.flags);
   this.rusai=this.add.image(256,282,['rusai-sleep','rusai-chain-awake','rusai-free'][data.flags.rusaiState]).setOrigin(.5,1).setDepth(282);
   for(const p of PILLARS){const cap=this.add.graphics().setDepth(p.y+12);drawPillar(cap,p.x,p.y);this.arch.push(cap)}
  }else{
   g.fillStyle(0x25262c);g.fillRect(0,0,320,240);
   for(let y=0;y<240;y+=16)for(let x=0;x<320;x+=16){g.fillStyle(((x/16+y/16)%2)?0x2b2b30:0x25262c,.95);g.fillRect(x,y,16,16);g.lineStyle(1,0x34343a,.65);g.strokeRect(x,y,16,16)}
   g.fillStyle(0x343238);g.fillRect(12,24,296,204);g.lineStyle(3,0x77716a);g.strokeRect(12,24,296,204);
   g.fillStyle(0x493e34);g.fillRect(50,70,74,58);g.fillStyle(0x786851);g.fillRect(56,76,62,6);
   g.fillStyle(0x3a3734);g.fillRect(158,91,88,42);g.fillStyle(0x786b59);g.fillRect(166,98,72,7);g.fillStyle(0x15171c);g.fillRect(12,163,16,42);
  }
  this.player=this.add.image(data.x,data.y,'x-front-1').setOrigin(.5,1).setDepth(data.y);
  const cam=this.cameras.main;cam.setBounds(0,0,data.room==='cathedral'?480:320,data.room==='cathedral'?512:240);
  cam.roundPixels=true;cam.startFollow(this.player,true,.35,.35);cam.centerOn(data.x,data.y);
 }
 setKey(k,v){this.keys[k.length===1?k.toLowerCase():k]=v}
 move(dir){
  if(!$('title').classList.contains('hidden')||dialogue||!$('modal').classList.contains('hidden')||!$('pin-modal').classList.contains('hidden'))return;
  const step=4;let x=data.x,y=data.y;
  if(dir==='up'){y-=step;data.dir='up'}if(dir==='down'){y+=step;data.dir='down'}if(dir==='left'){x-=step;data.dir='left'}if(dir==='right'){x+=step;data.dir='right'}
  if(!this.blocked(x,y)){
   data.x=x;data.y=y;this.lastStepAt=this.time.now;
   if(data.room==='cathedral'&&dir==='right'&&y>303&&y<353&&x>=453){enterSide();return}
   if(data.room==='side'&&dir==='left'&&y>163&&y<205&&x<=26){leaveSide();return}
  }
 }
 blocked(x,y){if(data.room==='cathedral')return cathedralBlocked(x,y);
  if(x<23||x>299||y<39||y>218)return true;
  return hit(x,y,45,65,128,135)||hit(x,y,152,85,252,140)
 }
 draw(){if(!this.player||!this.player.active)return;const walking=this.time.now-(this.lastStepAt||0)<190;const tick=walking?Math.floor(this.time.now/150)%3:0;
  const tex=data.dir==='up'?['x-back-1','x-back-2','x-back-3'][tick]:data.dir==='down'?['x-front-1','x-front-2','x-front-3'][tick]:data.dir==='left'?(walking&&tick?'x-side-2':'x-side-1'):(walking&&tick?'x-side-3':'x-side-4');
  this.player.setTexture(tex);this.player.setPosition(data.x,data.y);this.player.setDepth(data.y);this.player.setFlipX(false)
 }
 update(t){if(dialogue||!$('modal').classList.contains('hidden')||!$('pin-modal').classList.contains('hidden'))return;let dir=null;
  for(const [key,d] of [['ArrowUp','up'],['w','up'],['ArrowDown','down'],['s','down'],['ArrowLeft','left'],['a','left'],['ArrowRight','right'],['d','right']])if(this.keys[key]){dir=d;break}
  if(dir&&t-lastMove>60){lastMove=t;this.move(dir)}
 }
}

const game=new Phaser.Game({type:Phaser.AUTO,parent:'game',width:320,height:240,pixelArt:true,antialias:false,transparent:false,backgroundColor:'#202129',scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:CathedralScene});
})();

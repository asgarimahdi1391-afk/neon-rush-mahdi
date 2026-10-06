(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const overlay = document.getElementById('overlay');
  const titleEl = document.getElementById('overlayTitle');
  const textEl = document.getElementById('overlayText');
  const startBtn = document.getElementById('startBtn');
  const W = canvas.width, H = canvas.height;
  const keys = new Set();
  let running = false, score = 0, frame = 0, level = 1, last = 0;
  let player, orbs, enemies, particles, stars, dash = 0;
  const pointer = {active:false,x:W/2,y:H/2};
  const rand = (a,b) => a + Math.random()*(b-a);
  function reset(){
    score=0; frame=0; level=1; dash=0;
    player={x:W/2,y:H/2,r:13,speed:3.25,inv:0};
    orbs=[];enemies=[];particles=[];
    stars=Array.from({length:110},()=>({x:rand(0,W),y:rand(0,H),s:rand(.5,2),a:rand(.15,.7)}));
    for(let i=0;i<5;i++) addOrb();
    for(let i=0;i<2;i++) addEnemy();
    scoreEl.textContent='0';
  }
  function addOrb(){orbs.push({x:rand(30,W-30),y:rand(30,H-30),r:7,p:rand(0,6.28)});}
  function addEnemy(){
    let side=Math.floor(rand(0,4)),x=side===0?0:side===1?W:rand(0,W),y=side===2?0:side===3?H:rand(0,H);
    enemies.push({x,y,r:rand(11,15),speed:rand(1.05,1.4)+level*.06,phase:rand(0,6.28)});
  }
  function burst(x,y,color,n=12){for(let i=0;i<n;i++){let a=rand(0,Math.PI*2),s=rand(1,4);particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rand(18,35),color});}}
  function start(){reset();running=true;overlay.classList.add('hidden');last=performance.now();requestAnimationFrame(loop);}
  function end(){running=false;titleEl.textContent='بازی تمام شد!';textEl.textContent=`امتیازت ${score} بود. دوباره تلاش کن و رکوردت را بهتر کن!`;startBtn.textContent='دوباره بازی کن';overlay.classList.remove('hidden');}
  function drawBackground(){
    ctx.fillStyle='#080b1c';ctx.fillRect(0,0,W,H);
    for(const s of stars){ctx.globalAlpha=s.a;ctx.fillStyle='#a9faff';ctx.fillRect(s.x,s.y,s.s,s.s);}
    ctx.globalAlpha=1;
    ctx.strokeStyle='#26315a55';ctx.lineWidth=1;
    for(let x=0;x<W;x+=45){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=45){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  }
  function loop(now){
    if(!running)return;
    const dt=Math.min(2,(now-last)/16.67||1);last=now;frame++;
    level=1+Math.floor(score/10);
    if(frame%Math.max(45,130-level*7)===0)addEnemy();
    drawBackground();
    let dx=0,dy=0;
    if(keys.has('ArrowLeft')||keys.has('a'))dx--;
    if(keys.has('ArrowRight')||keys.has('d'))dx++;
    if(keys.has('ArrowUp')||keys.has('w'))dy--;
    if(keys.has('ArrowDown')||keys.has('s'))dy++;
    if(pointer.active){dx=pointer.x-player.x;dy=pointer.y-player.y;const d=Math.hypot(dx,dy);if(d>6){dx/=d;dy/=d;}else{dx=0;dy=0;}}
    const len=Math.hypot(dx,dy)||1;
    const boost=dash>0?2.3:1;
    player.x=Math.max(player.r,Math.min(W-player.r,player.x+dx/len*player.speed*boost*dt));
    player.y=Math.max(player.r,Math.min(H-player.r,player.y+dy/len*player.speed*boost*dt));
    if(dash>0)dash-=dt;
    if(player.inv>0)player.inv-=dt;
    // Orbs
    for(let i=orbs.length-1;i>=0;i--){
      const o=orbs[i];o.p+=.06*dt;
      ctx.save();ctx.shadowBlur=22;ctx.shadowColor='#36f5ff';ctx.fillStyle='#baffff';
      ctx.beginPath();ctx.arc(o.x,o.y,o.r+Math.sin(o.p)*1.5,0,Math.PI*2);ctx.fill();ctx.restore();
      if(Math.hypot(player.x-o.x,player.y-o.y)<player.r+o.r+3){
        score++;scoreEl.textContent=score;burst(o.x,o.y,'#36f5ff',14);orbs.splice(i,1);addOrb();
        if(score%5===0) addEnemy();
      }
    }
    // Enemies
    for(const e of enemies){
      e.phase+=.04*dt;
      let vx=player.x-e.x,vy=player.y-e.y,d=Math.hypot(vx,vy)||1;
      e.x+=vx/d*e.speed*dt+Math.cos(e.phase)*.25;
      e.y+=vy/d*e.speed*dt+Math.sin(e.phase)*.25;
      ctx.save();ctx.shadowBlur=22;ctx.shadowColor='#ff3eaa';ctx.fillStyle='#ff3eaa';
      ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#ffd5f0';ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y,e.r+4,0,Math.PI*2);ctx.stroke();ctx.restore();
      if(Math.hypot(player.x-e.x,player.y-e.y)<player.r+e.r && player.inv<=0){
        burst(player.x,player.y,'#ff3eaa',25);end();return;
      }
    }
    // Player glow and trail
    ctx.save();ctx.shadowBlur=28;ctx.shadowColor='#36f5ff';
    ctx.fillStyle=player.inv>0&&Math.floor(frame/4)%2?'#ffffff':'#36f5ff';
    ctx.beginPath();ctx.arc(player.x,player.y,player.r,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#eaffff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(player.x,player.y,player.r+5,0,Math.PI*2);ctx.stroke();ctx.restore();
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;ctx.globalAlpha=Math.max(0,p.life/35);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,3,3);if(p.life<=0)particles.splice(i,1);}
    ctx.globalAlpha=1;
    ctx.fillStyle='#b7c2ed';ctx.font='15px Arial';ctx.textAlign='left';ctx.fillText('LEVEL '+level,18,28);
    requestAnimationFrame(loop);
  }
  window.addEventListener('keydown',e=>{
    const k=e.key.toLowerCase();keys.add(k);
    if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();
    if(k==='shift'&&running&&dash<=0)dash=12;
    if((k==='enter'||k===' ')&&!running)start();
  });
  window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
  function point(e){const r=canvas.getBoundingClientRect();pointer.x=(e.clientX-r.left)*W/r.width;pointer.y=(e.clientY-r.top)*H/r.height;}
  canvas.addEventListener('pointerdown',e=>{pointer.active=true;point(e);});
  canvas.addEventListener('pointermove',e=>{if(pointer.active)point(e);});
  window.addEventListener('pointerup',()=>pointer.active=false);
  startBtn.addEventListener('click',start);
  reset();drawBackground();
})();

(() => {
  'strict mode';
  const app = document.getElementById('app-view');
  const KEY = 'kivo-jump-progress-v1';
  const chars = {
    lime:{name:'Verde Lima',img:'assets/personajes/amarillo-kivo.png',color:'#dfff00'},
    orange:{name:'Naranja',img:'assets/personajes/naranja-kivo.png',color:'#ff8200'},
    blue:{name:'Azul',img:'assets/personajes/azul-kivo.png',color:'#087cff'},
    pink:{name:'Rosa',img:'assets/personajes/rosa-kivo.png',color:'#ff2da6'},
    black:{name:'Negro',img:'assets/personajes/negro-kivo.png',color:'#ffffff'}
  };
  let progress = loadProgress();
  let view='home', selected=progress.selected||'lime', level=1, paused=false, game=null, loop=null;
  let last=0;
  let gameSnapshot=null;

  function loadProgress(){
    try {
      const p=JSON.parse(localStorage.getItem(KEY)||'{}');
      return {selected:['lime','orange','blue','pink','black'].includes(p.selected)?p.selected:'lime', unlocked:Math.max(1,Math.min(3,Number(p.unlocked)||1)), record:Math.max(0,Number(p.record)||0), points:Math.max(0,Number(p.points)||0), best: p.best&&typeof p.best==='object'?p.best:{}, badges:Array.isArray(p.badges)?p.badges:[], sound:p.sound!==false};
    } catch(e){return {selected:'lime',unlocked:1,record:0,points:0,best:{},badges:[],sound:true};}
  }
  function save(){localStorage.setItem(KEY,JSON.stringify(progress));}
  function stop(){ if(loop) cancelAnimationFrame(loop); loop=null; game=null; paused=false; }
  function img(type, cls=''){ const c=chars[type]; return `<img class="kj-char-img ${cls}" src="${c.img}" data-fallback="black" alt="Personaje ${c.name}" onerror="this.style.display='none';this.parentElement?.classList.add('kj-missing-character')">`; }
  function stars(n=5){return Array.from({length:n},()=>'<i>★</i>').join('');}
  function screen(html, cls=''){ app.innerHTML=`<section class="screen kj-screen ${cls}">${html}</section>`; }

  function render(){
    const appView=document.getElementById('app-view');
    if(appView)appView.scrollTop=0;
    if(view==='game'){if(appView)appView.style.overflow='hidden';return renderGame();}
    if(appView)appView.style.overflow='';
    if(view==='pause') return renderPause();
    stop();
    if(view==='character') return renderCharacters();
    if(view==='levels') return renderLevels();
    if(view==='result') return renderResult();
    renderHome();
  }
  function renderHome(){
    screen(`<header class="kj-top"><button class="kj-icon-button" data-action="kj-back" aria-label="Volver">‹</button><strong>KIVO PLAY</strong><button class="kj-sound" data-action="kj-sound">${progress.sound?'♪':'×'}</button></header><div class="kj-home"><div class="kj-home-art"><i class="kj-cloud c1"></i><i class="kj-cloud c2"></i><span class="kj-star-float f1">★</span><span class="kj-star-float f2">★</span><div class="kj-platforms"><div></div><div></div><div></div></div><div class="kj-party">${img('lime','kj-char-a')}${img('pink','kj-char-b')}${img('blue','kj-char-c')}${img('orange','kj-char-d')}</div></div><p class="kj-kicker">PEQUEÑOS SALTOS, GRANDES LOGROS</p><h1>¡HORA<br>DE JUGAR!</h1><button class="kj-main-button" data-action="kj-play">JUGAR AHORA <span>→</span></button><button class="kj-secondary-button" data-action="kj-character">ELEGIR PERSONAJE</button><button class="kj-how-button" data-action="kj-how">¿CÓMO JUGAR?</button><div class="kj-stats"><div><b>${progress.record}</b><small>Récord</small></div><div><b>${progress.unlocked}/3</b><small>Nivel máximo</small></div><div><b>${progress.points}</b><small>Puntos Play</small></div></div><div class="kj-badge-row"><span>Insignias</span><b>${progress.badges.length}/3</b></div></div>`, 'kj-home-screen'); }

  function renderCharacters(){
    const cards=Object.keys(chars).map(k=>`<button class="kj-character-card ${selected===k?'selected':''}" data-action="kj-select" data-type="${k}" style="--kj:${chars[k].color}">${img(k)}<b>${chars[k].name}</b><small>${selected===k?'ELEGIDO':'ELEGIR'}</small></button>`).join('');
    screen(`<header class="kj-top"><button class="kj-icon-button" data-action="kj-home" aria-label="Volver">‹</button><strong>PERSONAJES</strong><span></span></header><div class="kj-choose"><p class="kj-kicker">¿QUIÉN TE ACOMPAÑA?</p><h1>ELEGÍ TU<br>COMPAÑERO</h1><p>Todos saltan igual. Elegí con el que más te guste.</p><div class="kj-character-grid">${cards}</div><button class="kj-main-button" data-action="kj-levels">¡VAMOS A JUGAR! <span>→</span></button></div>`, 'kj-dark-screen'); }
  function renderLevels(){
    const data=[['PRIMEROS PASOS','Todo empieza con un pequeño paso',1,'#dfff00'],['SEGUÍ AVANZANDO','Vas mejor de lo que pensás',2,'#ff2da6'],['GRAN FINAL','¡Mirá hasta dónde llegaste!',3,'#087cff']];
    const cards=data.map(([name,msg,n,color])=>`<button class="kj-level-card ${n<=progress.unlocked?'':'locked'}" data-action="${n<=progress.unlocked?'kj-start':''}" data-level="${n}" style="--level:${color}"><span>0${n}</span><div><b>${name}</b><small>${msg}</small></div><i>${n<=progress.unlocked?'→':'🔒'}</i></button>`).join('');
    screen(`<header class="kj-top"><button class="kj-icon-button" data-action="kj-character" aria-label="Volver">‹</button><strong>ELEGÍ NIVEL</strong><span></span></header><div class="kj-levels"><p class="kj-kicker">KIVO JUMP</p><h1>TRES SALTOS<br>PUEDEN CAMBIAR TODO</h1>${cards}</div>`, 'kj-dark-screen'); }

  let resultData={win:false,score:0,stars:0,time:0,level:1};
  function renderGame(){
    screen(`<header class="kj-game-head"><button class="kj-icon-button" data-action="kj-pause" aria-label="Pausar">Ⅱ</button><div><small>NIVEL ${level}</small><b>${['PRIMEROS PASOS','SEGUÍ AVANZANDO','GRAN FINAL'][level-1]}</b></div><div class="kj-live"><span>♥ ${game?.lives||3}</span><span>★ ${game?.collected||0}</span></div></header><div class="kj-canvas-wrap"><canvas id="kj-canvas" width="393" height="410" aria-label="Juego KIVO JUMP"></canvas><div id="kj-game-progress"><i></i></div></div><button class="kj-jump-button" data-action="kj-jump">SALTAR <span>↑</span></button>`, 'kj-game-screen');
    setupGame(level);
  }
  function renderPause(){
    screen(`<div class="kj-modal"><div class="kj-pause-card"><p class="kj-kicker">UN DESCANSITO</p><h1>¿SEGUIMOS?</h1><button class="kj-main-button" data-action="kj-continue">CONTINUAR <span>→</span></button><button class="kj-secondary-button" data-action="kj-restart">REINICIAR</button><button class="kj-how-button" data-action="kj-exit">SALIR</button></div></div>`, 'kj-dark-screen kj-modal-screen'); paused=true; }
  function renderResult(){
    const win=resultData.win;
    screen(`<header class="kj-top"><button class="kj-icon-button" data-action="kj-exit" aria-label="Volver">‹</button><strong>KIVO JUMP</strong><span></span></header><div class="kj-result"><div class="kj-confetti">${Array.from({length:20},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div><p class="kj-kicker">${win?'NIVEL COMPLETADO':'LOS TROPIZOS TAMBIÉN CUENTAN'}</p><h1>${win?'¡LO LOGRASTE!':'¡OTRO INTENTO!'}</h1><p>${win?'Cada pequeño avance cuenta':'Los tropiezos también son parte del camino'}</p><div class="kj-result-character">${img(selected,'kj-result-img')}<span>${win?'★':''}</span></div><div class="kj-result-score"><div><b>${resultData.stars}</b><small>Estrellas</small></div><div><b>${resultData.score}</b><small>Puntos Play</small></div><div><b>${resultData.time}s</b><small>Tiempo</small></div></div>${win&&resultData.level===3?`<div class="kj-five-chars">${Object.keys(chars).map(k=>img(k)).join('')}</div>`:''}<button class="kj-main-button" data-action="${win&&resultData.level<3?'kj-next':'kj-restart'}">${win&&resultData.level<3?'SIGUIENTE NIVEL':'VOLVER A JUGAR'} <span>→</span></button><button class="kj-secondary-button" data-action="kj-character">CAMBIAR PERSONAJE</button><button class="kj-how-button" data-action="kj-exit">VOLVER A KIVO</button></div>`, 'kj-dark-screen'); }

  function setupGame(n){
    const canvas=document.getElementById('kj-canvas'), ctx=canvas.getContext('2d');
    const configs={'1':{speed:125,length:2700,holes:[650,1050,1900],obstacles:[820,1450,2200]},'2':{speed:155,length:3000,holes:[520,980,1450,2050,2520],obstacles:[720,1200,1680,2250,2700]},'3':{speed:180,length:3400,holes:[480,900,1320,1760,2300,2820],obstacles:[650,1120,1540,2050,2600,3050]}};
    const c=configs[n];
    const base=[0,c.length];
    const platforms=[{x:0,y:350,w:520,h:60},{x:580,y:350,w:260,h:60},{x:900,y:350,w:260,h:60},{x:1220,y:350,w:260,h:60},{x:1540,y:350,w:300,h:60},{x:1900,y:350,w:260,h:60},{x:2220,y:350,w:260,h:60},{x:2540,y:350,w:320,h:60},{x:2920,y:350,w:480,h:60}];
    // Extra reachable platforms and varied heights.
    for(let x=380;x<c.length-180;x+=420){ const y=[310,280,330][Math.floor(x/420)%3]; platforms.push({x,y,w:150,h:22,movable:false}); }
    const obstacleX=c.obstacles.map((x,i)=>({x,y:310-(i%2)*18,w:42,h:40+i%2*10}));
    const stars=[]; for(let x=260;x<c.length;x+=n===1?380:330){ stars.push({x,y:x%840===0?245:275,w:20,h:20,taken:false}); }
    game={canvas,ctx,world:c.length,speed:c.speed,platforms,obstacles:obstacleX,stars,lives:3,collected:0,x:55,y:300,vx:c.speed,vy:0,w:38,h:48,onGround:false,inv:0,camera:0,time:0,particles:[],score:0};
    game.playerImg=new Image(); game.playerImg.src=chars[selected].img;
    if(gameSnapshot){const snap=gameSnapshot;for(const key of ['lives','collected','x','y','vy','onGround','inv','camera','time','score','particles'])if(key in snap)game[key]=snap[key];game.stars=snap.stars||game.stars;gameSnapshot=null;}
    paused=false; last=performance.now(); loop=requestAnimationFrame(tick);
  }
  function jump(){ if(view==='game'&&!paused&&game&&game.onGround){game.vy=-520;game.onGround=false; if(window.KivoAudio)window.KivoAudio.effect('jump');else tone(560,.08);}}
  function loseLife(reset=true){ if(!game||game.inv>0)return; game.lives--; game.inv=1.5; tone(120,.18); if(game.lives<=0){ finish(false); return;} if(reset){game.x=Math.max(55,game.camera+20);game.y=260;game.vy=0;} particles(game.x,game.y,'#ff2da6',12); }
  function particles(x,y,color,n=8){if(!game)return;for(let i=0;i<n;i++)game.particles.push({x,y,vx:(Math.random()*180-90),vy:(Math.random()*-180),life:.7,color});}
  function tick(now){
    if(!game||view!=='game')return;
    const dt=Math.min(.033,Math.max(0,(now-last)/1000));last=now;
    if(!paused) update(dt);
    draw();
    loop=requestAnimationFrame(tick);
  }
  function update(dt){
    game.time+=dt;game.inv=Math.max(0,game.inv-dt);
    game.vx=game.speed; game.x+=game.vx*dt; game.vy+=1250*dt; game.y+=game.vy*dt; game.onGround=false;
    const prevBottom=game.y+game.h-game.vy*dt;
    for(const p of game.platforms){ if(game.x+game.w>p.x&&game.x<p.x+p.w&&game.y+game.h>=p.y&&prevBottom<=p.y+10&&game.vy>=0){game.y=p.y-game.h;game.vy=0;game.onGround=true;} }
    // A gap is a fall if the player is over exposed ground and below the base line.
    const supported=game.platforms.some(p=>game.x+game.w>p.x&&game.x<p.x+p.w&&game.y+game.h>=p.y-5&&game.y+game.h<=p.y+18);
    if(game.y>430&&!supported)loseLife(true);
    for(const o of game.obstacles){ if(game.x+game.w>o.x&&game.x<o.x+o.w&&game.y+game.h>o.y&&game.y<o.y+o.h)loseLife(true); }
    for(const s of game.stars){ if(!s.taken&&game.x+game.w>s.x&&game.x<s.x+s.w&&game.y+game.h>s.y&&game.y<s.y+s.h){s.taken=true;game.collected++;game.score+=100;particles(s.x,s.y,'#ffd600',10);tone(880,.09);} }
    game.camera=Math.max(0,Math.min(game.world-393,game.x-105));
    game.particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=300*dt;p.life-=dt;});game.particles=game.particles.filter(p=>p.life>0);
    const bar=document.getElementById('kj-game-progress')?.firstElementChild;if(bar)bar.style.width=`${Math.min(100,(game.x/game.world)*100)}%`;
    if(game.x>=game.world-160){finish(true);}
  }
  function draw(){
    const c=game.ctx,w=c.canvas.width,h=c.canvas.height;c.clearRect(0,0,w,h);
    const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#15151a');sky.addColorStop(1,'#232127');c.fillStyle=sky;c.fillRect(0,0,w,h);
    c.fillStyle='#303038';for(let i=0;i<8;i++){let x=((i*170-game.camera*.25)%650)-50;c.beginPath();c.arc(x,70+(i%3)*25,24,0,Math.PI*2);c.fill();}
    c.fillStyle='#ffffff';c.font='900 18px Arial';for(let i=0;i<12;i++){c.globalAlpha=.15;c.fillText('✦',(i*125-game.camera*.5)%520,110+(i%4)*35);}c.globalAlpha=1;
    for(const p of game.platforms){const x=p.x-game.camera;c.fillStyle='#ff2da6';c.fillRect(x,p.y,p.w,p.h);c.fillStyle='#dfff00';c.fillRect(x,p.y-7,p.w,7);c.fillStyle='#111014';for(let xx=x+12;xx<x+p.w;xx+=35)c.fillRect(xx,p.y+8,18,5);}
    for(const s of game.stars){if(s.taken)continue;const x=s.x-game.camera,y=s.y+Math.sin(game.time*5+s.x)*4;c.save();c.translate(x,y);c.fillStyle='#ffd600';c.beginPath();for(let i=0;i<10;i++){let a=-Math.PI/2+i*Math.PI/5,r=i%2?7:14;c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.fill();c.restore();}
    for(const o of game.obstacles){const x=o.x-game.camera;c.fillStyle='#087cff';c.fillRect(x,o.y,o.w,o.h);c.fillStyle='#ffffff';c.fillRect(x+8,o.y+8,7,7);c.fillRect(x+27,o.y+8,7,7);}
    const goalX=game.world-100-game.camera;c.fillStyle='#dfff00';c.fillRect(goalX,250,16,100);c.fillStyle='#ff2da6';c.fillRect(goalX-25,225,66,34);c.fillStyle='#111014';c.font='900 12px Arial';c.fillText('KIVO',goalX-19,247);
    for(const p of game.particles){c.globalAlpha=Math.max(0,p.life/.7);c.fillStyle=p.color;c.fillRect(p.x-game.camera,p.y,4,4);}c.globalAlpha=1;
    const px=game.x-game.camera,py=game.y;
    if(game.playerImg.complete&&game.playerImg.naturalWidth>0){
      c.save();
      if(game.inv>0)c.globalAlpha=.5+Math.sin(game.time*30)*.3;
      c.drawImage(game.playerImg,px-5,py-5,game.w+10,game.h+10);
      c.restore();
    }
  }
  function finish(win){ if(!game)return; const score=game.score+game.collected*100+(win?500:0)+Math.max(0,game.lives*100); resultData={win,score,stars:game.collected,time:Math.round(game.time),level}; stop(); if(window.KivoAudio)window.KivoAudio.stopMusic();
    if(win){progress.unlocked=Math.max(progress.unlocked,Math.min(3,level+1));progress.best[level]=Math.max(progress.best[level]||0,score);progress.record=Math.max(progress.record,score);progress.points+=score;addBadge(win?'explorador':'salto');if(game.lives===3)addBadge('sin-tropiezos');if(progress.points>=3000)addBadge('estrellas');save();}else save(); view='result'; render(); }
  function addBadge(id){const names={explorador:'Explorador KIVO','sin-tropiezos':'Sin tropiezos',estrellas:'Cazador de estrellas',salto:'Primer salto'};if(!progress.badges.includes(id))progress.badges.push(id);}
  function tone(freq,duration){if(!progress.sound)return;try{const C=window.AudioContext||window.webkitAudioContext;const c=new C();const o=c.createOscillator(),g=c.createGain();o.frequency.value=freq;o.type='sine';g.gain.value=.04;o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+duration);}catch(e){}}

  function handleAction(action,button){
    if(action==='kj-back'||action==='kj-exit'){stop();if(window.KivoAudio)window.KivoAudio.stopMusic();view='home';if(window.KivoApp&&typeof window.KivoApp.navigate==='function'){window.KivoApp.navigate('play-select')}else{const nav=document.querySelector('[data-nav="play-select"]');if(nav)nav.click();else{render();}}return;}
    if(action==='kj-home'){stop();if(window.KivoAudio)window.KivoAudio.stopMusic();view='home';render();return;}
    if(action==='kj-sound'){progress.sound=!progress.sound;save();render();return;}
    if(action==='kj-play'||action==='kj-next'){level=action==='kj-next'?Math.min(3,resultData.level+1):Math.max(1,progress.unlocked);view='levels';render();return;}
    if(action==='kj-character'){view='character';render();return;}
    if(action==='kj-levels'){view='levels';render();return;}
    if(action==='kj-select'){selected=button.dataset.type;progress.selected=selected;save();render();return;}
    if(action==='kj-start'){level=Number(button.dataset.level)||1;view='game';if(window.KivoAudio){window.KivoAudio.effect('jump');window.KivoAudio.startMusic('jump')}render();return;}
    if(action==='kj-jump')jump();
    if(action==='kj-pause'){if(view==='game'&&game){gameSnapshot=JSON.parse(JSON.stringify(game,(key,value)=>['canvas','ctx','playerImg'].includes(key)?undefined:value));if(loop)cancelAnimationFrame(loop);loop=null;view='pause';if(window.KivoAudio)window.KivoAudio.pauseMusic();render();}return;}
    if(action==='kj-continue'){view='game';paused=false;if(window.KivoAudio)window.KivoAudio.resumeMusic();render();return;}
    if(action==='kj-restart'){view='game';if(window.KivoAudio){window.KivoAudio.effect('jump');window.KivoAudio.startMusic('jump')}render();return;}
    if(action==='kj-how')alert('Saltá para superar obstáculos, huecos y plataformas. Reuní estrellas amarillas y llegá a la meta KIVO.');
  }
  document.addEventListener('keydown',e=>{if(document.body.dataset.route!=='kivo-play')return;if([' ','ArrowUp'].includes(e.key)){e.preventDefault();jump();}if(e.key.toLowerCase()==='p'&&view==='game'&&game){gameSnapshot=JSON.parse(JSON.stringify(game,(key,value)=>['canvas','ctx','playerImg'].includes(key)?undefined:value));if(loop)cancelAnimationFrame(loop);loop=null;view='pause';render();}});
  document.addEventListener('pointerdown',e=>{if(document.body.dataset.route==='kivo-play'&&e.target.id==='kj-canvas')jump();});

  document.addEventListener('click',e=>{
    const back=e.target.closest('[data-action="kj-back"],[data-action="kj-exit"]');
    if(!back||document.body.dataset.route!=='kivo-play')return;
    e.preventDefault();
    e.stopPropagation();
    stop();
    if(window.KivoAudio)window.KivoAudio.stopMusic();
    view='home';
    if(window.KivoApp&&typeof window.KivoApp.navigate==='function'){
      window.KivoApp.navigate('play-select');
    }else{
      const selector=document.querySelector('[data-nav="play-select"]');
      if(selector)selector.click();
    }
  },true);

  window.KivoJump={render,handleAction,stop};
})();
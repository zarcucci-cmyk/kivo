(() => {
  'strict';
  const KEY='kivo-quest-progress-v1';
  const chars={pink:'assets/personajes/rosa-kivo.png',lime:'assets/personajes/amarillo-kivo.png',orange:'assets/personajes/naranja-kivo.png',blue:'assets/personajes/azul-kivo.png'};
  const decorations=[
    {id:'lampara',name:'Lámpara',category:'muebles',icon:'🪔'},
    {id:'estante',name:'Estante',category:'muebles',icon:'🗄️'},
    {id:'sillon',name:'Sillón',category:'muebles',icon:'🛋️'},
    {id:'cama',name:'Cama',category:'muebles',icon:'🛏️'},
    {id:'planta',name:'Planta',category:'detalles',icon:'🪴'},
    {id:'cuadro',name:'Cuadro',category:'detalles',icon:'🖼️'},
    {id:'libros',name:'Libros',category:'detalles',icon:'📚'},
    {id:'flor',name:'Flor',category:'detalles',icon:'🌼'},
    {id:'cojin',name:'Almohadón',category:'detalles',icon:'🧸'},
    {id:'estrellas',name:'Estrellitas',category:'detalles',icon:'✨'},
    {id:'rosa',name:'Kivo rosa',category:'kivitos',src:chars.pink},
    {id:'naranja',name:'Kivo naranja',category:'kivitos',src:chars.orange},
    {id:'azul',name:'Kivo azul',category:'kivitos',src:chars.blue},
    {id:'lima',name:'Kivo lima',category:'kivitos',src:chars.lime}
  ];
  const rooms=[
    {id:'rest',n:'01',name:'Descanso',color:'#ff35b5',icon:'pink',copy:'Prepará un rincón tranquilo.'},
    {id:'cook',n:'02',name:'Cocina',color:'#ff7900',icon:'orange',copy:'Encontrá las parejas de la cocina.'},
    {id:'move',n:'03',name:'Movimiento',color:'#0879ff',icon:'blue',copy:'Repetí la secuencia de movimientos.'},
    {id:'create',n:'04',name:'Creatividad',color:'#d6ff00',icon:'lime',copy:'Decorá tu rincón KIVO.'}
  ];
  let q={view:'cover',room:0,completed:[],inventory:[],stars:0};
  try{q={...q,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch(e){console.error(e)}
  const app=document.getElementById('app-view');
  function save(){localStorage.setItem(KEY,JSON.stringify(q))}
  function img(type,cls=''){return `<img class="${cls}" src="${chars[type]||chars.pink}" alt="Personaje KIVO">`}
  function header(){return `<div class="kq-header"><button data-kq-back aria-label="Volver">←</button><span class="kq-brand">KIVO QUEST</span><button data-kq-map aria-label="Mapa">⌂</button></div>`}
  function render(){
    document.body.dataset.route='kivo-quest';
    if(q.view==='cover') cover(); else if(q.view==='map') map(); else if(q.view==='success') success(); else game(q.room);
    window.scrollTo({top:0,behavior:'auto'}); if(app) app.scrollTop=0;
  }
  function cover(){
    app.innerHTML=`<section class="screen kq-screen"><div class="kq-cover">${header()}<div class="kq-cover-art"><div class="kq-door"></div><img class="kq-cover-char" src="${chars.pink}" alt="Personaje rosa"><i class="kj-star-float f1">★</i><i class="kj-star-float f2">✦</i></div><h1>KIVO<br><span>QUEST</span></h1><p class="kq-copy">Cuatro habitaciones. Cuatro pequeñas misiones.<br>Seguí tu camino, un desafío a la vez.</p><button class="kq-main-button" id="kq-play">ENTRAR <span>→</span></button><div class="kq-cover-stats"><div><b>${q.completed.length}/4</b><small>HABITACIONES</small></div><div><b>${q.stars}</b><small>ESTRELLAS QUEST</small></div><div><b>${q.inventory.length}</b><small>OBJETOS</small></div></div></div></section>`;
  }
  function map(){
    const cards=rooms.map((r,i)=>{const locked=i>0&&!q.completed.includes(rooms[i-1].id);const done=q.completed.includes(r.id);return `<button class="kq-room-card ${locked?'locked':''} ${done?'completed':''}" data-kq-room="${i}" ${locked?'disabled':''}><small>${r.n} · ${done?'COMPLETADA':'HABITACIÓN'}</small>${img(r.icon,'kq-room-ill')}<b>${locked?'🔒 ':''}${r.name}</b></button>`}).join('');
    const pct=Math.round(q.completed.length/rooms.length*100);
    app.innerHTML=`<section class="screen kq-screen"><div class="kq-map">${header()}<div class="kq-map-title"><p>UN CAMINO A TU RITMO</p><h1>Tu aventura<span style="color:#ff35b5">.</span></h1></div><div class="kq-map-grid">${cards}</div><div class="kq-progress"><i style="width:${pct}%"></i></div><div class="kq-map-inventory"><b>Inventario:</b> ${q.inventory.length?q.inventory.join(' · '):'Todavía no hay objetos guardados.'}</div></div></section>`;
  }
  function game(index){
    q.room=index;q.view='game';save();const r=rooms[index];
    const isRest=r.id==='rest';
    app.innerHTML=`<section class="screen kq-screen ${isRest?'kq-rest-screen':''}"><div class="kq-minigame ${isRest?'kq-rest-minigame':''} ${r.id==='create'?'kq-create-minigame':''}"><div class="kq-game-head"><button data-kq-back aria-label="Volver atrás">←</button><b>${isRest?'MINIJUEGO KIVO':`${r.n} · ${r.name.toUpperCase()}`}</b><span class="kq-star-wallet">✦ ${q.stars}</span></div><div class="kq-game-copy"><small>${isRest?'':'MINIJUEGO KIVO'}</small><h1>${r.name}</h1><p>${r.copy}</p></div>${isRest?restGame():r.id==='cook'?memoryGame():r.id==='move'?movementGame():decorationGame()}</div></section>`;
    bindGame(r.id);
  }
  function restGame(){return `<div class="kq-rest-stage"><div class="kq-rest-cloud-badge" aria-hidden="true"><svg viewBox="0 0 64 48"><path d="M17 39h31a11 11 0 0 0 1-22 18 18 0 0 0-34-2 12 12 0 0 0 2 24Z"/></svg></div><div class="kq-drop" aria-label="Lugar tranquilo, recompensa una estrella"><span>LUGAR<br>TRANQUILO</span><b>✦ 1</b></div><div class="kq-rest-bed"><span class="kq-rest-pillow"></span></div><div class="kq-rest-character-wrap"><img class="kq-rest-character" src="${chars.pink}" alt="Personaje rosa descansando"><span class="kq-rest-closed-eyes" aria-hidden="true"><i></i><i></i></span></div><span class="kq-rest-sleep" aria-hidden="true">Z z</span><span class="kq-rest-rays" aria-hidden="true"><i></i><i></i><i></i></span><button class="kq-drag-item kq-drag-moon" style="right:5%;bottom:5%" data-drag aria-label="Luna para tu lugar tranquilo"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M33 8a17 17 0 1 0 7 28A18 18 0 0 1 33 8Z"/></svg></button></div><p class="kq-rest-status" id="kq-rest-status" aria-live="polite">Tocá JUGAR y prepará un rincón tranquilo.</p><button class="kq-room-button kq-rest-play" data-rest-play aria-pressed="false">JUGAR <span aria-hidden="true">▶</span></button>`}
  function memoryGame(){const icons=['🥫','🥫','🥣','🥣','🧃','🧃'];const order=icons.sort(()=>Math.random()-.5);return `<div class="kq-kitchen-stage"><div class="kq-kitchen-shelf" aria-label="Objetos a encontrar"><span aria-label="Lata">🥫</span><b aria-label="Bol de cocina">🥣</b><i aria-label="Jugo">🧃</i></div><div class="kq-memory-grid">${order.map((x,i)=>`<button class="kq-memory-card hidden-card" data-mem="${x}" data-i="${i}" aria-label="Carta de cocina oculta"><span class="kq-card-mark">K</span></button>`).join('')}</div><div class="kq-kitchen-counter"></div></div>`}
  function movementGame(){return `<div class="kq-sequence">${['↑','→','✦'].map((x,i)=>`<button class="kq-sequence-btn" data-step="${x}" data-order="${i}">${x}</button>`).join('')}</div><p style="text-align:center;color:#aaa7b0;font-size:10px">Repetí: <b style="color:#ffd600">arriba · derecha · estrella</b></p>`}
  function decorationGame(){return `<div class="kq-decor-canvas" id="kq-canvas"><div class="kq-decor-room"><div class="kq-room-window"><span></span><i></i></div><div class="kq-room-shelf"><span>📚</span><span>🌱</span><span>📗</span></div><div class="kq-room-rug"></div><div class="kq-room-floor"></div></div>${(q.decorations||[]).map((id,i)=>placedDecoration(id,i)).join('')}</div><div class="kq-decoration-label"><span>Elegí objetos para tu rincón</span><b>0 decoraciones</b></div><div class="kq-decoration-tabs" role="group" aria-label="Categorías de decoración"><button class="active" data-decor-tab="muebles" aria-pressed="true">Muebles</button><button data-decor-tab="detalles" aria-pressed="false">Detalles</button><button data-decor-tab="kivitos" aria-pressed="false">Kivitos</button></div><div class="kq-decoration-choices" data-category="muebles">${decorations.map(item=>`<button class="kq-decoration-choice" data-decor="${item.id}" data-category="${item.category}" aria-label="Agregar ${item.name}" ${item.category==='muebles'?'':'hidden'}>${item.src?`<img src="${item.src}" alt="">`:`<span aria-hidden="true">${item.icon}</span>`}<small>${item.name}</small></button>`).join('')}</div><button class="kq-room-button" data-save-decoration>GUARDAR RINCÓN</button>`}
  function placedDecoration(id,index){const item=decorations.find(entry=>entry.id===id);if(!item)return '';const slots=[[8,13],[37,13],[66,13],[8,42],[37,42],[66,42],[8,70],[37,70],[66,70],[20,27],[50,27],[78,27]];const [left,top]=slots[index%slots.length];return `<button class="kq-decor-item ${item.src?'character':''}" data-placed-decor="${id}" style="left:${left}%;top:${top}%" aria-label="Quitar ${item.name} del rincón">${item.src?`<img src="${item.src}" alt="">`:`<span aria-hidden="true">${item.icon}</span>`}</button>`}
  function bindGame(id){
    if(id==='rest'){
      document.querySelectorAll('[data-drag]').forEach(el=>{let dragging=false;el.addEventListener('pointerdown',e=>{if(!document.querySelector('.kq-rest-stage')?.classList.contains('is-playing'))return;dragging=true;el.setPointerCapture?.(e.pointerId)});el.addEventListener('pointermove',e=>{if(!dragging)return;const s=document.querySelector('.kq-rest-stage').getBoundingClientRect();el.style.left=Math.max(0,Math.min(s.width-el.offsetWidth,e.clientX-s.left-el.offsetWidth/2))+'px';el.style.top=Math.max(0,Math.min(s.height-el.offsetHeight,e.clientY-s.top-el.offsetHeight/2))+'px';el.style.right='auto';el.style.bottom='auto'});el.addEventListener('pointerup',()=>{if(!dragging)return;dragging=false;const d=el.getBoundingClientRect(),drop=document.querySelector('.kq-drop').getBoundingClientRect();if(d.left<drop.right&&d.right>drop.left&&d.top<drop.bottom&&d.bottom>drop.top)finish('Nube de descanso','Descanso tranquilo')})});
    }
    if(id==='cook'){
      let first=null,matches=0;
      document.querySelectorAll('[data-mem]').forEach(card=>card.addEventListener('click',()=>{if(card.classList.contains('matched')||card===first)return;card.classList.remove('hidden-card');card.textContent=card.dataset.mem;card.setAttribute('aria-label','Objeto de cocina: '+card.dataset.mem);if(!first){first=card;return}if(first.dataset.mem===card.dataset.mem){first.classList.add('matched');card.classList.add('matched');matches++;first=null;if(matches===3)setTimeout(()=>finish('Delantal estrella','Parejas de cocina'),350)}else{const a=first;first=null;setTimeout(()=>{a.classList.add('hidden-card');a.setAttribute('aria-label','Carta de cocina oculta');a.innerHTML='<span class="kq-card-mark">K</span>';card.classList.add('hidden-card');card.setAttribute('aria-label','Carta de cocina oculta');card.innerHTML='<span class="kq-card-mark">K</span>'},550)}}));
    }
    if(id==='move'){
      const seq=['↑','→','✦'];let n=0;document.querySelectorAll('[data-step]').forEach(btn=>btn.addEventListener('click',()=>{btn.classList.add('active');setTimeout(()=>btn.classList.remove('active'),180);if(btn.dataset.step===seq[n]){n++;if(n===seq.length)setTimeout(()=>finish('Medalla movimiento','Secuencia completa'),250)}else{n=0}}));
    }
    if(id==='create'){
      const canvas=document.getElementById('kq-canvas');const counter=document.querySelector('.kq-decoration-label b');q.decorations=q.decorations||[];
      const updateCounter=()=>{const count=q.decorations.length;counter.textContent=count===1?'1 decoración':`${count} decoraciones`};
      document.querySelectorAll('[data-decor-tab]').forEach(tab=>tab.addEventListener('click',()=>{const category=tab.dataset.decorTab;document.querySelectorAll('[data-decor-tab]').forEach(button=>{const active=button===tab;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active))});document.querySelector('.kq-decoration-choices').dataset.category=category;document.querySelectorAll('.kq-decoration-choice').forEach(choice=>{choice.hidden=choice.dataset.category!==category})}));
      document.querySelectorAll('.kq-decoration-choice').forEach(button=>button.addEventListener('click',()=>{if(q.decorations.length>=12){counter.textContent='¡Rincón completo!';setTimeout(updateCounter,1000);return}const id=button.dataset.decor;q.decorations.push(id);canvas.insertAdjacentHTML('beforeend',placedDecoration(id,q.decorations.length-1));updateCounter();save();if(window.KivoAudio)window.KivoAudio.effect('pop')}));
      canvas.addEventListener('click',event=>{const item=event.target.closest('[data-placed-decor]');if(!item)return;const index=q.decorations.indexOf(item.dataset.placedDecor);if(index>=0)q.decorations.splice(index,1);item.remove();canvas.querySelectorAll('[data-placed-decor]').forEach((placed,i)=>{const slot=[[8,13],[37,13],[66,13],[8,42],[37,42],[66,42],[8,70],[37,70],[66,70],[20,27],[50,27],[78,27]][i%12];placed.style.left=slot[0]+'%';placed.style.top=slot[1]+'%'});updateCounter();save()});
      updateCounter();document.querySelector('[data-save-decoration]').addEventListener('click',()=>{if(q.decorations.length===0){const label=document.querySelector('.kq-decoration-label');counter.textContent='Elegí al menos un objeto';label.classList.add('kq-needs-item');setTimeout(()=>{label.classList.remove('kq-needs-item');updateCounter()},900);return}finish('Rincón creativo','Rincón decorado')});
    }
  }
  function finish(item,reason){if(!q.completed.includes(rooms[q.room].id)){q.completed.push(rooms[q.room].id);q.inventory.push(item);q.stars+=1;if(window.KivoAudio)window.KivoAudio.effect('win')}q.view='success';save();render();}
  function success(){const room=rooms[q.room];app.innerHTML=`<section class="screen kq-screen kq-success"><div class="kq-success-card">${img(room.icon,'')}<p class="kq-kicker">MISIÓN COMPLETADA</p><h1>¡Lo lograste!</h1><p>Tu aventura sigue creciendo.<br>Sumaste una estrella QUEST y un objeto nuevo.</p><span class="kq-badge">✦ ${q.inventory[q.inventory.length-1]||'Premio KIVO'}</span><button class="kq-main-button" style="margin-top:18px" data-kq-map>VOLVER AL MAPA <span>→</span></button></div></section>`}
  document.addEventListener('click',e=>{const play=e.target.closest('#kq-play');if(play){q.view='map';save();if(window.KivoAudio)window.KivoAudio.startMusic();render();return}if(e.target.closest('[data-rest-play]')){const stage=document.querySelector('.kq-rest-stage'),status=document.getElementById('kq-rest-status'),button=e.target.closest('[data-rest-play]');if(stage){stage.classList.add('is-playing');button.setAttribute('aria-pressed','true');button.innerHTML='¡A DESCANSAR! <span aria-hidden="true">▶</span>';if(status)status.textContent='Arrastrá la luna al círculo de lugar tranquilo.';if(window.KivoAudio)window.KivoAudio.effect('pop')}return}if(e.target.closest('[data-kq-back]')){if(q.view==='game'||q.view==='success'){q.view='map';render()}else if(q.view==='map'){q.view='cover';save();render()}else{if(window.KivoAudio)window.KivoAudio.stopMusic();if(window.KivoApp&&typeof window.KivoApp.navigate==='function'){window.KivoApp.navigate('play-select')}else{history.back()}}return}if(e.target.closest('[data-kq-map]')){q.view='map';save();render();return}const room=e.target.closest('[data-kq-room]');if(room){const i=Number(room.dataset.kqRoom);q.view='game';game(i)}});
  window.KivoQuest={render,save,getProgress:()=>({...q})};
})();
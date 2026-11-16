(() => {
  'use strict';
  const KEY = 'kivo-phrases-favorites-v1';
  const INDEX_KEY = 'kivo-phrases-index-v1';
  const app = document.getElementById('app-view');
  const phrases = [
    {id:'p1',text:'Un día a la vez.',highlight:'Un día',color:'#dfff00',character:'lime'},
    {id:'p2',text:'No hace falta hacerlo perfecto. Solo seguir.',highlight:'perfecto.',color:'#ff2da6',character:'pink'},
    {id:'p3',text:'Cada pequeño paso cuenta.',highlight:'pequeño paso',color:'#087cff',character:'orange'},
    {id:'p4',text:'Lo importante es volver a intentarlo.',highlight:'volver a intentarlo',color:'#dfff00',character:'blue'},
    {id:'p5',text:'Tu ritmo también está bien.',highlight:'Tu ritmo',color:'#ff8200',character:'pink'},
    {id:'p6',text:'Hoy también podés empezar.',highlight:'Hoy también',color:'#087cff',character:'lime'},
    {id:'p7',text:'Los pequeños hábitos crean grandes cambios.',highlight:'grandes cambios',color:'#ff2da6',character:'orange'},
    {id:'p8',text:'No subestimes lo que hacés cada día.',highlight:'cada día',color:'#dfff00',character:'blue'},
    {id:'p9',text:'Avanzar también es descansar.',highlight:'descansar',color:'#087cff',character:'pink'},
    {id:'p10',text:'Lo que construís hoy importa.',highlight:'hoy importa',color:'#ff8200',character:'lime'},
    {id:'p11',text:'La constancia se construye, no se exige.',highlight:'se construye',color:'#ff2da6',character:'orange'},
    {id:'p12',text:'Hacé espacio para lo que te hace bien.',highlight:'te hace bien',color:'#dfff00',character:'blue'},
    {id:'p13',text:'Tu progreso no tiene que parecerse al de nadie.',highlight:'al de nadie',color:'#087cff',character:'pink'},
    {id:'p14',text:'Empezar de nuevo también es avanzar.',highlight:'Empezar de nuevo',color:'#ff8200',character:'lime'},
    {id:'p15',text:'No necesitás hacerlo todo hoy.',highlight:'todo hoy',color:'#ff2da6',character:'orange'},
    {id:'p16',text:'Cada intento suma.',highlight:'Cada intento',color:'#dfff00',character:'blue'},
    {id:'p17',text:'Celebrá las pequeñas victorias.',highlight:'pequeñas victorias',color:'#087cff',character:'pink'},
    {id:'p18',text:'Seguí creando tu propio camino.',highlight:'tu propio camino',color:'#ff8200',character:'lime'},
    {id:'p19',text:'Lo que parece pequeño también puede ser importante.',highlight:'importante',color:'#ff2da6',character:'orange'},
    {id:'p20',text:'Tu historia se construye un día a la vez.',highlight:'un día a la vez',color:'#dfff00',character:'blue'}
  ];
  let index = Math.max(0, Math.min(phrases.length - 1, Number(localStorage.getItem(INDEX_KEY)) || 0));
  let favorites = loadFavorites();
  let view = 'carousel';
  let transitionLocked = false;
  let startX = 0;

  function loadFavorites(){try{const value=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(value)?value.filter(id=>phrases.some(p=>p.id===id)):[]}catch(e){return[]}}
  function saveFavorites(){localStorage.setItem(KEY,JSON.stringify([...new Set(favorites)]))}
  function current(){return phrases[index]}
  function escapeText(value){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  function renderPhrase(p,extra=''){
    let text=escapeText(p.text);
    const highlight=escapeText(p.highlight);
    if(text.includes(highlight)) text=text.replace(highlight,`<span style="color:${p.color}">${highlight}</span>`);
    return `<div class="kfp-card${extra}" role="group" aria-label="${escapeText(p.text)}"><div class="kfp-card-spark kfp-spark-a">✦</div><div class="kfp-card-spark kfp-spark-b">♡</div><p>${text}</p><img src="assets/personajes/${{lime:'amarillo',pink:'rosa',orange:'naranja',blue:'azul'}[p.character]}-kivo.png" alt="" class="kfp-character"></div>`;
  }
  function dots(){const active=Math.min(2,Math.floor(index/(phrases.length/3)));return `<div class="kfp-dots" aria-label="Frase ${index+1} de ${phrases.length}">${[0,1,2].map(i=>`<i class="${i===active?'active':''}"></i>`).join('')}</div>`}
  function header(){return `<header class="kfp-header"><button data-kfp="back" aria-label="Volver">‹</button><div class="kfp-logo">KIVO</div><button class="kfp-favorites-button ${view==='favorites'?'active':''}" data-kfp="favorites" aria-label="Ver frases favoritas">${favorites.length?'<span>'+favorites.length+'</span>':''}<svg viewBox="0 0 24 24"><path d="M12 21s-7-4.3-9.2-8.5C.8 8.5 2.8 4 7 4c2 0 3.7 1.2 5 3 1.3-1.8 3-3 5-3 4.2 0 6.2 4.5 4.2 8.5C19 16.7 12 21 12 21Z"/></svg></button></header>`}
  function render(){
    document.body.dataset.route='phrases-kivo';
    if(view==='favorites')renderFavorites();else renderCarousel();
  }
  function renderCarousel(){const p=current();const favorite=favorites.includes(p.id);app.innerHTML=`<section class="kfp-page"><div class="kfp-shell">${header()}<div class="kfp-carousel" tabindex="0" aria-label="Carrusel de frases"><div class="kfp-track">${renderPhrase(p)}</div><div class="kfp-stage-actions">${dots()}<button class="kfp-skip" data-kfp="next" aria-label="Pasar a otra frase">×</button><button class="kfp-heart ${favorite?'saved':''}" data-kfp="heart" aria-label="${favorite?'Quitar de favoritos':'Guardar en favoritos'}" aria-pressed="${favorite}"><span>♥</span></button><button class="kfp-share" data-kfp="share" aria-label="Compartir frase"><svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.6 6.8-4M8.6 13.4l6.8 4"/></svg></button></div></div></div></section>`;bindCarousel();}
  function renderFavorites(){const items=favorites.map(id=>phrases.find(p=>p.id===id)).filter(Boolean);app.innerHTML=`<section class="kfp-page"><div class="kfp-shell kfp-favorites-page">${header()}<div class="kfp-favorites-title"><p>TUS FRASES GUARDADAS</p><h1>Favoritos<span>.</span></h1></div><div class="kfp-favorite-list">${items.length?items.map(p=>`<button class="kfp-favorite-item" data-kfp="open-favorite" data-id="${p.id}"><span style="color:${p.color}">${escapeText(p.highlight)}</span><p>${escapeText(p.text)}</p><i aria-label="Quitar de favoritos" data-kfp="remove-favorite" data-id="${p.id}">♥</i></button>`).join(''):'<div class="kfp-empty"><img src="assets/personajes/rosa-kivo.png" alt=""><p>Todavía no guardaste frases.</p><button data-kfp="carousel">VOLVER A LEER</button></div>'}</div></div></section>`}
  function move(direction){if(transitionLocked)return;transitionLocked=true;const track=document.querySelector('.kfp-track');if(track)track.classList.add(direction>0?'kfp-leave-left':'kfp-leave-right');setTimeout(()=>{index=(index+direction+phrases.length)%phrases.length;localStorage.setItem(INDEX_KEY,String(index));renderCarousel();const newCard=document.querySelector('.kfp-card');if(newCard)newCard.classList.add(direction>0?'kfp-enter-right':'kfp-enter-left');transitionLocked=false},180)}
  function bindCarousel(){const carousel=document.querySelector('.kfp-carousel');if(!carousel)return;carousel.addEventListener('pointerdown',e=>{startX=e.clientX});carousel.addEventListener('pointerup',e=>{const diff=e.clientX-startX;if(Math.abs(diff)>45)move(diff<0?1:-1)});carousel.focus({preventScroll:true})}
  function toggleFavorite(){const p=current();if(favorites.includes(p.id)){favorites=favorites.filter(id=>id!==p.id)}else{favorites.push(p.id)}saveFavorites();renderCarousel();const heart=document.querySelector('.kfp-heart');if(heart){heart.classList.add('kfp-heart-pop');setTimeout(()=>heart.classList.remove('kfp-heart-pop'),260)}if(window.KivoAudio)window.KivoAudio.effect('reward')}
  async function shareCurrent(){const p=current();const text=`${p.text} ✨ — KIVO`;if(navigator.share){try{await navigator.share({text});return}catch(e){if(e.name==='AbortError')return}}if(navigator.clipboard&&window.isSecureContext){try{await navigator.clipboard.writeText(text);if(window.KivoApp?.toast)window.KivoApp.toast('Frase copiada.') ;return}catch(e){}}try{const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();const copied=document.execCommand('copy');area.remove();if(copied&&window.KivoApp?.toast)window.KivoApp.toast('Frase copiada.')}catch(e){}}
  document.addEventListener('keydown',e=>{if(document.body.dataset.route!=='phrases-kivo'||view==='favorites')return;if(e.key==='ArrowRight')move(1);if(e.key==='ArrowLeft')move(-1)});
  document.addEventListener('click',e=>{if(document.body.dataset.route!=='phrases-kivo')return;const control=e.target.closest('[data-kfp]');if(!control)return;const action=control.dataset.kfp;if(action==='back'){if(view==='favorites'){view='carousel';render()}else if(window.KivoApp?.goBack)window.KivoApp.goBack()}else if(action==='favorites'){view='favorites';render()}else if(action==='carousel'){view='carousel';render()}else if(action==='next')move(1);else if(action==='heart')toggleFavorite();else if(action==='share')shareCurrent();else if(action==='remove-favorite'){e.stopPropagation();favorites=favorites.filter(id=>id!==control.dataset.id);saveFavorites();renderFavorites()}else if(action==='open-favorite'){const found=phrases.findIndex(p=>p.id===control.dataset.id);if(found>=0){index=found;localStorage.setItem(INDEX_KEY,String(index));view='carousel';render()}}});
  window.KivoPhrases={render};
})();
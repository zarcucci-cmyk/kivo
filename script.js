(() => {
  'use strict';

  const STORE_KEY = 'kivo-prototype-v2';
  const INSTAGRAM_URL = 'https://www.instagram.com/somoskivoapp/?utm_source=ig_web_button_share_sheet';
  const COLORS = {
    pink: '#ff35b5',
    lime: '#d6ff00',
    orange: '#ff7900',
    blue: '#0879ff',
    black: '#111014'
  };
  const TYPES = ['pink', 'lime', 'orange', 'blue', 'black'];
  const CATEGORIES = [
    ['Salud', 'salud', 'pink'], ['Ejercicio', 'ejercicio', 'orange'],
    ['Estudio', 'estudio', 'blue'], ['Bienestar', 'bienestar', 'lime'],
    ['Sueño', 'sueno', 'blue'], ['Social', 'social', 'pink'],
    ['Creatividad', 'creatividad', 'orange'], ['Finanzas', 'finanzas', 'lime'],
    ['Ambiente', 'ambiente', 'lime']
  ];
  const PRODUCTS = [
    { id: 'hoodie', name: 'Hoodie KIVO', type: 'ropa', price: 80, color: 'pink', detail: 'Tu próximo abrazo favorito. Un clásico para llevar KIVO con vos.' },
    { id: 'tote', name: 'Tote bag KIVO', type: 'accesorios', price: 45, color: 'lime', detail: 'Liviana, práctica y lista para acompañar tus pequeños pasos.' },
    { id: 'notebook', name: 'Cuaderno KIVO', type: 'papeleria', price: 35, color: 'blue', detail: 'Un espacio para tus ideas, tus listas y todo lo que estás creando.' },
    { id: 'stickers', name: 'Stickers KIVO', type: 'papeleria', price: 20, color: 'orange', detail: 'Un poquito de color para recordarte que cada día suma.' },
    { id: 'keyring', name: 'Llavero de personajes', type: 'accesorios', price: 30, color: 'pink', detail: 'Tu personaje favorito, siempre cerca.' },
    { id: 'bundle', name: 'Kit de celebración', type: 'accesorios', price: 100, color: 'blue', detail: 'Una sorpresa especial para festejar todo lo que venís construyendo.' }
  ];
  const DEFAULT_HABITS = [
    { id: 'water', name: 'Beber agua', description: 'Un vaso para recargar energía.', category: 'salud', character: 'blue', color: 'blue', target: '2 vasos', frequency: 'Diario', weekdays: [0,1,2,3,4,5,6], time: '', reminder: false, createdAt: new Date().toISOString() },
    { id: 'move', name: 'Mover el cuerpo', description: 'Un ratito de movimiento cuenta.', category: 'ejercicio', character: 'orange', color: 'orange', target: '15 minutos', frequency: 'Diario', weekdays: [0,1,2,3,4,5,6], time: '', reminder: false, createdAt: new Date().toISOString() },
    { id: 'read', name: 'Leer un poco', description: 'Unas páginas para vos.', category: 'estudio', character: 'pink', color: 'pink', target: '10 páginas', frequency: 'Diario', weekdays: [0,1,2,3,4,5,6], time: '', reminder: false, createdAt: new Date().toISOString() },
    { id: 'sleep', name: 'Prepararme para dormir', description: 'Bajar un cambio también es cuidarte.', category: 'sueno', character: 'lime', color: 'lime', target: '7–8 horas', frequency: 'Diario', weekdays: [0,1,2,3,4,5,6], time: '', reminder: false, createdAt: new Date().toISOString() }
  ];
  const $ = (selector, root = document) => root.querySelector(selector);
  const appView = $('#app-view');
  const nav = $('#bottom-nav');
  const toastNode = $('#toast');
  const modalRoot = $('#modal-root');
  let toastTimer;
  let state = loadState();
  let route = 'store';
  let routeData = {};
  let historyStack = [];
  let navExpanded = false;
  let rewardTab = 'logros';
  let storeTab = 'todos';
  let feedTab = 'todos';
  let statsPeriod = 'semana';
  let customizeTab = 'sombreros';
  let characterPreview = state.character || 'pink';
  let accessoryPreview = { ...state.accessory };

  function initialState() {
    return {
      onboardingComplete: false,
      name: 'Zoe',
      email: '',
      username: 'zoe',
      stars: 0,
      habits: DEFAULT_HABITS.map((habit) => ({ ...habit })),
      completions: {},
      starAwards: {},
      character: 'pink',
      accessory: { hat: 'Ninguno', glasses: 'Ninguna', tint: 'original', background: 'blanco' },
      sound: false,
      music: false,
      effects: true,
      volume: 60,
      inventory: [],
      redeemed: [],
      surpriseDays: {},
      posts: [
        { id: 'demo-1', name: 'Mora', character: 'pink', date: 'Hoy', text: '¡Dos días seguidos haciendo ejercicio! Cada día me siento con más energía.', likes: 8, comments: ['¡Vamos, Mora!'], demo: true },
        { id: 'demo-2', name: 'Fran', character: 'blue', date: 'Ayer', text: 'Hoy completé mi meta de lectura. Un pequeño hábito que cambia mucho.', likes: 5, comments: [], demo: true }
      ],
      likes: []
    };
  }

  function loadState() {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      const legacy = !saved ? localStorage.getItem('kivo-app-state-v1') : null;
      if (!saved && !legacy) return initialState();
      const parsed = JSON.parse(saved || legacy);
      if (!parsed || !Array.isArray(parsed.habits)) throw new Error('Datos guardados incompletos.');
      const base = initialState();
      const validHabit = (habit) => habit && typeof habit.id === 'string' && typeof habit.name === 'string';
      return {
        ...base,
        ...parsed,
        onboardingComplete: typeof parsed.onboardingComplete === 'boolean' ? parsed.onboardingComplete : Boolean(legacy),
        name: typeof parsed.name === 'string' ? parsed.name.slice(0, 24) : base.name,
        email: typeof parsed.email === 'string' ? parsed.email.slice(0, 120) : '',
        username: typeof parsed.username === 'string' ? parsed.username.slice(0, 24) : base.username,
        stars: Number.isFinite(parsed.stars) && parsed.stars >= 0 ? Math.floor(parsed.stars) : 0,
        music: typeof parsed.music === 'boolean' ? parsed.music : false,
        effects: typeof parsed.effects === 'boolean' ? parsed.effects : true,
        volume: Number.isFinite(parsed.volume) ? Math.max(0, Math.min(100, parsed.volume)) : 60,
        habits: parsed.habits.filter(validHabit).map((habit) => ({
          ...habit,
          description: typeof habit.description === 'string' ? habit.description : '',
          category: habit.category || 'bienestar',
          character: TYPES.includes(habit.character) ? habit.character : 'pink',
          color: TYPES.includes(habit.color) ? habit.color : 'pink',
          target: typeof habit.target === 'string' ? habit.target : '',
          frequency: habit.frequency || 'Diario',
          weekdays: Array.isArray(habit.weekdays) ? habit.weekdays : [0,1,2,3,4,5,6],
          createdAt: habit.createdAt || new Date().toISOString()
        })),
        completions: parsed.completions && typeof parsed.completions === 'object' ? parsed.completions : {},
        starAwards: parsed.starAwards && typeof parsed.starAwards === 'object' ? parsed.starAwards : parsed.earned || {},
        character: TYPES.includes(parsed.character) ? parsed.character : base.character,
        inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [],
        redeemed: Array.isArray(parsed.redeemed) ? parsed.redeemed : [],
        surpriseDays: parsed.surpriseDays && typeof parsed.surpriseDays === 'object' ? parsed.surpriseDays : {},
        posts: Array.isArray(parsed.posts) ? parsed.posts : base.posts,
        likes: Array.isArray(parsed.likes) ? parsed.likes : [],
        accessory: { ...base.accessory, ...(parsed.accessory || {}) }
      };
    } catch (error) {
      console.error('No se pudo recuperar el progreso de KIVO:', error);
      return initialState();
    }
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
      if (window.KivoAudio) window.KivoAudio.setFromAppState(state);
      return true;
    } catch (error) {
      console.error('No se pudo guardar el progreso de KIVO:', error);
      toast('No se pudo guardar. Revisá el espacio disponible en el dispositivo.');
      return false;
    }
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }
  function todayKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  function dateFromKey(key) {
    const [year, month, day] = key.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  function completionsFor(key) { return Array.isArray(state.completions[key]) ? state.completions[key] : []; }
  function doneToday() { return completionsFor(todayKey()); }
  function isDone(habit, date = new Date()) { return completionsFor(todayKey(date)).includes(habit.id); }
  function scheduled(habit, date = new Date()) {
    if (habit.frequency === 'Semanal') return (date.getDay() + 6) % 7 === 0;
    const day = (date.getDay() + 6) % 7;
    return !Array.isArray(habit.weekdays) || habit.weekdays.includes(day);
  }
  function weekBounds(date) {
    const start = new Date(date);
    start.setDate(date.getDate() - (date.getDay() + 6) % 7);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return [start, end];
  }
  function weekHasCompletion(habitId, start, end) {
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    while (cursor <= end) {
      if (completionsFor(todayKey(cursor)).includes(habitId)) return true;
      cursor.setDate(cursor.getDate() + 1);
    }
    return false;
  }
  function activeHabits(date = new Date()) {
    return state.habits.filter((habit) => habit.frequency === 'Semanal' || scheduled(habit, date));
  }
  function showNav() { return !['splash', 'onboarding1', 'onboarding2', 'onboarding3', 'register', 'sound-settings', 'phrases-kivo', 'kivo-play', 'kivo-quest'].includes(route); }
  function displayDate(date = new Date(), options = { weekday: 'long', day: 'numeric', month: 'long' }) {
    return new Intl.DateTimeFormat('es-AR', options).format(date);
  }
  function toast(message) {
    toastNode.textContent = message;
    toastNode.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastNode.classList.remove('show'), 2600);
  }
  function navigate(next, data = {}, replace = false) {
    navExpanded = false;
    if (!replace) historyStack.push({ route, data: routeData });
    if (!['kivo-play','kivo-quest'].includes(next) && window.KivoAudio) window.KivoAudio.stopMusic();
    if (next === 'customize') {
      characterPreview = state.character || 'pink';
      accessoryPreview = { ...state.accessory };
    }
    route = next;
    routeData = data;
    render();
    appView.scrollTop = 0;
    appView.scrollLeft = 0;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
  function goBack() {
    const previous = historyStack.pop();
    if (previous) { route = previous.route; routeData = previous.data; }
    else route = 'home';
    render();
    appView.scrollTop = 0;
    appView.scrollLeft = 0;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
  function icon(name, cls = '') {
    const paths = {
      home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z"/>',
      chart: '<path d="M4 19V5m0 14h17M8 15l4-4 3 2 5-6"/>',
      people: '<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0 1 12 0m2-9a3 3 0 1 0 0-6m1 9a5 5 0 0 1 3 5"/>',
      user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
      back: '<path d="m15 18-6-6 6-6M9 12h11"/>',
      star: '<path d="m12 2.8 2.7 6.2 6.7.6-5 4.4 1.5 6.5-5.9-3.4-5.9 3.4 1.5-6.5-5-4.4L9.3 9 12 2.8Z"/>',
      bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 12h4"/>',
      check: '<path d="m4 10 4 4 8-8"/>',
      edit: '<path d="m4 16-.8 4 4-.8L19 7.4a2.1 2.1 0 0 0-3-3L4 16Z"/>',
      fire: '<path d="M12 22c4.4 0 7-3.1 7-7.2 0-2.7-1.3-5-3.8-7.2-.1 2.4-1.1 3.6-2 4.1.2-4.6-1.8-8.3-5.1-10.7.6 4.5-1.1 6.4-2.8 8.7C3.9 11.6 5 22 12 22Z"/>',
      heart: '<path d="M20.8 8.8c0 4.3-8.8 10-8.8 10s-8.8-5.7-8.8-10a4.5 4.5 0 0 1 8.8-1.3 4.5 4.5 0 0 1 8.8 1.3Z"/>',
      bag: '<path d="M4 8h16l-1 13H5L4 8Zm4 0a4 4 0 0 1 8 0"/>',
      close: '<path d="m6 6 12 12M18 6 6 18"/>',
      more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>'
    };
    return `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.star}</svg>`;
  }

  function character(type = 'pink', size = 'md', extraClass = '') {
    if (type === 'lime') {
      return `<img class="kivo-character character-lime character-${size} ${extraClass}" src="assets/personajes/amarillo-kivo.png" alt="Personaje amarillo KIVO" />`;
    }
    if (type === 'orange') {
      return `<img class="kivo-character character-orange character-${size} ${extraClass}" src="assets/personajes/naranja-kivo.png" alt="Personaje naranja KIVO" />`;
    }
    if (type === 'blue') {
      return `<img class="kivo-character character-blue character-${size} ${extraClass}" src="assets/personajes/azul-kivo.png" alt="Personaje azul KIVO" />`;
    }
    if (type === 'pink') {
      return `<img class="kivo-character character-pink character-${size} ${extraClass}" src="assets/personajes/rosa-kivo.png" alt="Personaje rosa KIVO" />`;
    }
    const chosen = TYPES.includes(type) ? type : 'pink';
    const fill = COLORS[chosen];
    const stroke = chosen === 'black' ? '#fff' : '#111014';
    const shape = chosen === 'pink'
      ? '<path class="body-shape" d="M50 7 91 81H62l-4 14q-1 6-7 5l-5-1q-5-1-3-7l3-11H34l2 13q1 6-4 8l-5 2q-6 2-7-5l4-18H9L50 7Z"/>'
      : chosen === 'lime'
        ? '<path class="body-shape" d="M50 4c8 0 10 10 17 14 8 4 19-1 23 6 4 6-3 16 0 24 3 8 13 13 10 21-3 8-15 8-20 15-5 6-5 19-13 21-7 2-12-9-20-9s-13 11-21 8c-7-3-4-15-9-22-4-7-17-10-17-18s12-13 15-21c3-8-3-17 2-23 5-6 15 0 23-3C47 13 43 4 50 4Z"/>'
        : chosen === 'orange'
          ? '<rect class="body-shape" x="12" y="12" width="76" height="72" rx="6"/>'
          : chosen === 'blue'
            ? '<path class="body-shape" d="M50 6C39 22 17 45 17 64a33 33 0 0 0 66 0C83 45 61 22 50 6Z"/>'
            : '<circle class="body-shape" cx="50" cy="50" r="39"/>';
    const eyes = chosen === 'blue'
      ? '<path d="M34 46q5 8 10 0m12 0q5 8 10 0" fill="none" stroke="#111014" stroke-width="4.5" stroke-linecap="round"/>'
      : chosen === 'orange'
        ? '<g fill="#111014"><ellipse cx="39" cy="47" rx="3.7" ry="6"/><path d="M57 45q5-5 10 0" fill="none" stroke="#111014" stroke-width="4" stroke-linecap="round"/></g>'
        : chosen === 'black'
          ? '<g fill="#fff"><ellipse cx="39" cy="47" rx="4" ry="6"/><ellipse cx="61" cy="47" rx="4" ry="6"/></g>'
          : '<g fill="#111014"><ellipse cx="39" cy="47" rx="4" ry="6"/><ellipse cx="61" cy="47" rx="4" ry="6"/></g>';
    const faceAccent = chosen === 'orange'
      ? '<path d="M73 40l7-5m-6 12 8-1" fill="none" stroke="#111014" stroke-width="3" stroke-linecap="round"/>'
      : chosen === 'pink'
        ? '<path d="M31 61q-5 4-8 9m46-9q5 4 8 9" fill="none" stroke="#111014" stroke-width="2.5" stroke-linecap="round"/>'
        : '';
    const limbPath = chosen === 'pink' || chosen === 'lime'
      ? 'M23 56Q13 53 6 62M77 56q10-3 17 6'
      : 'M23 56Q13 53 6 62M77 56q10-3 17 6M39 81l-5 18m27-18 5 18';
    const limbs = chosen === 'black'
      ? `<path d="${limbPath}" stroke="#fff" stroke-width="13"/><path d="${limbPath}" stroke="#111014" stroke-width="8"/>`
      : `<path d="${limbPath}" stroke="${fill}" stroke-width="9"/>`;
    return `<svg class="kivo-character character-${chosen} character-${size} ${extraClass}" viewBox="0 0 100 112" role="img" aria-label="Personaje KIVO ${chosen}" xmlns="http://www.w3.org/2000/svg">
      <g class="limbs" stroke-linecap="round" stroke-linejoin="round" fill="none">
        ${limbs}
      </g>
      ${shape}
      <g class="face">${eyes}</g>${faceAccent}
      ${chosen === 'lime' ? '<circle cx="25" cy="33" r="3" fill="#ff35ae"/><circle cx="75" cy="33" r="3" fill="#ff35ae"/>' : ''}
    </svg>`;
  }
  function logo() {
    return '<img class="logo" src="assets/logo-kivo.png" alt="Logo oficial de KIVO">';
  }
  function sparkles(count = 5) { return `<span class="sparkle-field" aria-hidden="true">${Array.from({ length: count }, (_, i) => `<i class="sparkle s${i + 1}">✦</i>`).join('')}</span>`; }
  function topbar(title = '', back = true, dark = false) {
    return `<header class="sub-topbar ${dark ? 'dark' : ''}">${back ? `<button class="back-button" data-action="back" aria-label="Volver">${icon('back')}</button>` : `<span class="topbar-spacer"></span>`}<span class="topbar-title">${escapeHtml(title)}</span><button class="top-star" data-go="rewards" aria-label="Ver estrellas">${icon('star')}<b>${state.stars}</b></button></header>`;
  }
  function navButton(id, label, iconName, action) {
    const active = route === id || (id === 'play-select' && ['kivo-play','kivo-quest'].includes(route)) || (id === 'home' && route === 'habit-detail') || (id === 'store' && route === 'rewards') || (id === 'more' && ['community','profile','play-select','kivo-play','kivo-quest'].includes(route));
    const moreAttributes = id === 'more' ? `aria-expanded="${navExpanded}" aria-label="Más opciones"` : '';
    return `<button class="nav-button ${active ? 'active' : ''}" data-nav="${id}" ${active ? 'aria-current="page"' : ''} ${moreAttributes}>${action === 'create' ? '<span class="nav-create">+</span>' : icon(iconName)}<span>${label}</span></button>`;
  }
  function renderNav() {
    nav.innerHTML = showNav()
      ? `${navButton('home', 'Inicio', 'home')}${navButton('progress', 'Progreso', 'chart')}${navButton('create-habit', 'Crear', '', 'create')}${navButton('store', 'Tienda', 'bag')}${navButton('more', 'Más', 'more')}${navExpanded ? `<div class="nav-more-menu" id="nav-more-menu" aria-label="Más opciones de navegación">${navButton('community', 'Comunidad', 'people')}${navButton('play-select', 'Jugar', 'star')}${navButton('profile', 'Perfil', 'user')}</div>` : ''}`
      : '';
    nav.hidden = !showNav();
  }
  function screen(content, className = '') {
    appView.innerHTML = `<section class="screen ${className}">${content}</section>`;
    renderNav();
  }

  function render() {
    document.body.dataset.route = route;
    renderNav();
    document.querySelector('meta[name="theme-color"]').content = ['splash', 'onboarding1', 'onboarding2', 'onboarding3', 'play-select', 'phrases-kivo', 'kivo-play', 'kivo-quest'].includes(route) ? '#111014' : '#ffffff';
    const screens = {
      splash: renderSplash,
      onboarding1: () => renderOnboarding(1),
      onboarding2: () => renderOnboarding(2),
      onboarding3: () => renderOnboarding(3),
      register: renderRegister,
      home: renderHome,
      'habit-detail': renderHabitDetail,
      'create-habit': renderCreateHabit,
      'edit-habit': renderCreateHabit,
      progress: renderProgress,
      rewards: renderRewards,
      store: renderStore,
      'product-detail': renderProductDetail,
      community: renderCommunity,
      profile: renderProfile,
      'sound-settings': renderSoundSettings,
      'phrases-kivo': () => window.KivoPhrases ? window.KivoPhrases.render() : screen('<p>Cargando FRASES KIVO…</p>', 'dark-screen'),
      surprise: renderSurprise,
      customize: renderCustomize,
      'play-select': renderPlaySelector,
      'kivo-play': () => window.KivoJump ? window.KivoJump.render() : screen('<p>Cargando KIVO PLAY…</p>'),
      'kivo-quest': () => window.KivoQuest ? window.KivoQuest.render() : screen('<p>Cargando KIVO QUEST…</p>')
    };
    (screens[route] || renderHome)();
  }

  function renderPlaySelector() {
    screen(`<div class="play-select-page"><header class="play-select-header"><button class="back-button light-back" data-action="back" aria-label="Volver">${icon('back')}</button><div><p>UN MUNDO PARA JUGAR</p><b>Zona de juegos</b></div><span>✦</span></header><div class="play-select-hero"><p>SELECCIONÁ TU AVENTURA</p><h1>¿Qué queremos<br>hacer hoy<span class="pink-dot">?</span></h1><div class="play-select-friends"><img src="assets/personajes/naranja-kivo.png" alt="Personaje naranja"><img src="assets/personajes/rosa-kivo.png" alt="Personaje rosa"><img src="assets/personajes/azul-kivo.png" alt="Personaje azul"></div></div><div class="play-game-list"><button class="play-game-card jump-card" data-go="kivo-play"><div class="play-card-art"><span class="play-star-one">★</span><img src="assets/personajes/amarillo-kivo.png" alt="KIVO Jump"></div><div><small>JUEGO DE SALTO</small><h2>KIVO<br>JUMP</h2><p>Saltá, esquivá y sumá estrellas.</p></div><span class="play-card-arrow">→</span></button><button class="play-game-card quest-card" data-go="kivo-quest"><div class="play-card-art"><span class="play-star-two">✦</span><img src="assets/personajes/rosa-kivo.png" alt="KIVO Quest"></div><div><small>CUATRO HABITACIONES</small><h2>KIVO<br>QUEST</h2><p>Completá misiones y decorá tu mundo.</p></div><span class="play-card-arrow">→</span></button></div></div>`, 'dark-screen play-selector-screen');
  }
  function renderSplash() {
    screen(`<div class="splash-screen">${sparkles(7)}<div class="splash-brand"><img class="splash-logo" src="assets/logo-kivo.png" alt="Logo oficial de KIVO"><p>UN DÍA A LA VEZ</p></div><div class="splash-scene" aria-hidden="true"><span class="splash-hill splash-hill-back"></span><span class="splash-hill splash-hill-front"></span><div class="splash-scene-friends">${character('blue', 'xl', 'splash-scene-blue')}${character('orange', 'xl', 'splash-scene-orange')}${character('pink', 'xl', 'splash-scene-hero')}${character('lime', 'xl', 'splash-scene-lime')}</div><span class="splash-scene-spark splash-scene-spark-one">✦</span><span class="splash-scene-spark splash-scene-spark-two">✦</span></div><p class="splash-caption">PEQUEÑAS ACCIONES,<br>GRANDES CAMBIOS.</p><button class="button button-lime button-wide" data-action="start">COMENZAR <span>→</span></button><span class="splash-footer">Tu progreso empieza con un paso.</span></div>`, 'dark-screen');
  }
  function renderOnboarding(step) {
    const slides = {
      1: { title: 'PEQUEÑAS<br>ACCIONES<br><em>GRANDES<br>CAMBIOS</em>', text: 'KIVO te acompaña a crear hábitos que suman, un día a la vez.', character: 'pink', deco: '♡' },
      2: { title: 'TU CONSTANCIA<br><em>TAMBIÉN<br>CUENTA</em>', text: 'Registrá tus hábitos, mirá tu progreso y celebrá cada logro.', character: 'lime', deco: '✦' },
      3: { title: 'UNA VERSIÓN<br>TUYA MÁS<br><em>AUTÉNTICA</em>', text: 'Más hábitos, más bienestar, más de lo que te hace bien.', character: 'orange', deco: '♛' }
    };
    const slide = slides[step];
    const previous = step > 1 ? `<button class="onboarding-back" data-action="onboarding-back">←</button>` : '<span></span>';
    const lastStep = step === 3;
    const forward = lastStep ? 'CONTINUAR' : 'SIGUIENTE';
    screen(`<div class="onboarding-screen"><div class="onboarding-header">${previous}<span>${step} / 3</span></div><p class="eyebrow light-eyebrow">KIVO · UN DÍA A LA VEZ</p><h1>${slide.title}</h1><p class="onboarding-copy">${slide.text}</p><div class="onboarding-art">${sparkles(5)}<span class="onboarding-doodle">${slide.deco}</span>${character(slide.character, 'xl', 'onboarding-character')}</div><div class="onboarding-bottom"><div class="onboarding-dots">${[1,2,3].map((n) => `<span class="${n === step ? 'current' : ''}"></span>`).join('')}</div><button class="button ${lastStep ? 'button-white' : 'button-pink'}" data-action="${lastStep ? 'finish-onboarding' : 'onboarding-next'}">${forward} <span>→</span></button></div></div>`, 'dark-screen');
  }

  function renderRegister() {
    screen(`<div class="register-screen">
      <button class="onboarding-back register-back" data-action="onboarding-back" aria-label="Volver">←</button>
      <div class="register-art">${sparkles(4)}${character('pink', 'lg', 'register-character')}<span class="register-heart">♡</span></div>
      <p class="eyebrow">TU CAMINO EMPIEZA ACÁ</p>
      <h1>Creá tu perfil<span>.</span></h1>
      <p class="register-intro">Un espacio tuyo para guardar tus hábitos y celebrar cada paso.</p>
      <form class="register-form" id="register-form">
        <label for="register-name">¿Cómo te llamás?</label>
        <input id="register-name" name="name" type="text" maxlength="24" autocomplete="given-name" placeholder="Tu nombre" value="${escapeHtml(state.name === 'Zoe' && !state.email ? '' : state.name)}" required>
        <label for="register-email">Tu correo</label>
        <input id="register-email" name="email" type="email" maxlength="120" autocomplete="email" placeholder="hola@ejemplo.com" value="${escapeHtml(state.email)}" required>
        <label for="register-username">Elegí un usuario</label>
        <div class="username-field"><span>@</span><input id="register-username" name="username" type="text" maxlength="24" pattern="[A-Za-z0-9_]+" autocomplete="username" placeholder="tu_usuario" value="${escapeHtml(state.username === 'zoe' && !state.email ? '' : state.username)}" required></div>
        <button class="button button-pink button-wide" type="submit">CREAR MI PERFIL <span>→</span></button>
      </form>
      <p class="register-note">Prototipo de muestra: tu perfil se guarda en este dispositivo. No se crea una cuenta online.</p>
    </div>`, 'dark-screen');
  }

  function weekDays() {
    const today = new Date();
    const start = new Date(today);
    const offset = (today.getDay() + 6) % 7;
    start.setDate(today.getDate() - offset);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const done = completionsFor(todayKey(date)).some((id) => state.habits.some((habit) => habit.id === id));
      return `<div class="week-day ${todayKey(date) === todayKey() ? 'today' : ''} ${done ? 'completed' : ''}"><span>${new Intl.DateTimeFormat('es-AR', { weekday: 'narrow' }).format(date).toLocaleUpperCase('es-AR')}</span><b>${date.getDate()}</b>${done ? '<i>✓</i>' : ''}</div>`;
    }).join('');
  }
  function streakCount() {
    const cursor = new Date();
    if (!completionsFor(todayKey(cursor)).length) cursor.setDate(cursor.getDate() - 1);
    let days = 0;
    while (completionsFor(todayKey(cursor)).length) { days++; cursor.setDate(cursor.getDate() - 1); }
    return days;
  }
  function renderHome() {
    const habits = activeHabits();
    const completed = habits.filter((habit) => isDone(habit)).length;
    const displayName = state.name || 'amiga';
    screen(`<div class="main-topbar">${logo()}<div class="header-actions"><button class="home-stars" data-go="rewards" aria-label="${state.stars} estrellas">${icon('star')}<b>${state.stars}</b></button><button class="icon-button" data-go="surprise" aria-label="Sorpresa diaria">${icon('bell')}</button><button class="avatar-button" data-go="profile">${character(state.character, 'xs')}</button></div></div>
      <div class="home-heading"><p class="eyebrow">${escapeHtml(displayDate().toLocaleUpperCase('es-AR'))}</p><h1>¡Hola, ${escapeHtml(displayName)}!<span class="pink-dot">.</span></h1><p>Un día a la vez <span class="yellow-heart">♥</span></p></div>
      <div class="week-strip">${weekDays()}</div>
      <button class="streak-banner" data-go="progress"><span class="streak-fire">${icon('fire')}</span><span><b>${streakCount()} ${streakCount() === 1 ? 'día' : 'días'} de racha</b><small>Tu constancia también cuenta</small></span><span class="banner-arrow">→</span><span class="banner-spark">✦</span></button>
      <div class="section-head"><div><p class="eyebrow">PASITO A PASITO</p><h2>Mis hábitos de hoy</h2></div><span class="count-chip">${completed}/${habits.length}</span></div>
      <div class="home-habits">${habits.length ? habits.map((habit) => habitCard(habit)).join('') : emptyState('Tu próxima idea empieza acá.', 'Sumá un hábito para armar tu rutina.', 'create-habit')}</div>
      <button class="add-habit-inline" data-go="create-habit"><span>+</span> Crear un hábito nuevo</button>
      <div class="quick-grid"><button class="quick-tile tile-pink" data-go="rewards">${icon('star')}<b>Recompensas</b><small>Tu camino se celebra</small></button><button class="quick-tile tile-lime" data-go="store">${icon('bag')}<b>Tienda KIVO</b><small>Canjeá tus estrellas</small></button><button class="quick-tile tile-orange" data-go="surprise"><span class="quick-symbol">♡</span><b>Sorpresa diaria</b><small>Una alegría por día</small></button><button class="quick-tile tile-pink" data-go="phrases-kivo"><span class="quick-symbol">“</span><b>Frases KIVO</b><small>Una pausa de inspiración</small></button></div>
      <p class="demo-hint">Ideas de hábitos de ejemplo · Podés editarlos o borrarlos</p>`);
  }
  function habitCard(habit) {
    const complete = isDone(habit);
    return `<article class="habit-row ${complete ? 'done' : ''}" style="--habit:${COLORS[habit.color] || COLORS.lime}"><button class="habit-character" data-go="habit-detail" data-id="${escapeHtml(habit.id)}">${character(habit.character || 'pink', 'sm')}</button><button class="habit-info" data-go="habit-detail" data-id="${escapeHtml(habit.id)}"><b>${escapeHtml(habit.name)}</b><small>${escapeHtml(habit.description || habit.target || 'Cada día suma.')}</small></button><button class="habit-toggle" data-action="toggle-habit" data-id="${escapeHtml(habit.id)}" aria-pressed="${complete}" aria-label="${complete ? 'Desmarcar' : 'Completar'} ${escapeHtml(habit.name)}">${icon('check')}</button></article>`;
  }
  function emptyState(title, text, action) {
    return `<div class="empty-state">${character('blue', 'md')}<b>${escapeHtml(title)}</b><p>${escapeHtml(text)}</p><button class="button button-dark" data-go="${action}">Empezar</button></div>`;
  }

  function renderHabitDetail() {
    const habit = state.habits.find((item) => item.id === routeData.id) || state.habits[0];
    if (!habit) { navigate('home', {}, true); return; }
    const days = weekDaysDetail(habit);
    const doneCount = Object.values(state.completions).filter((ids) => ids.includes(habit.id)).length;
    const rate = habitDaysScheduled(habit) ? Math.min(100, Math.round(habitMonthlyDoneCount(habit.id) / habitDaysScheduled(habit) * 100)) : 0;
    const todayDone = isDone(habit);
    screen(`${topbar('Detalle del hábito')}<div class="detail-hero">${character(habit.character || 'blue', 'xl', 'detail-character')}<span class="detail-badge">${escapeHtml(categoryName(habit.category))}</span></div><div class="detail-title"><div><p class="eyebrow">TU HÁBITO</p><h1>${escapeHtml(habit.name)}</h1></div><button class="icon-button bordered" data-action="edit-habit" data-id="${escapeHtml(habit.id)}" aria-label="Editar hábito">${icon('edit')}</button></div><p class="detail-description">${escapeHtml(habit.description || 'Cada pequeño paso cuenta.')}</p>
      <section class="detail-panel"><div class="section-head"><div><p class="eyebrow">HOY</p><h2>${todayDone ? '¡Lo lograste!' : 'Tu meta de hoy'}</h2></div><span class="detail-today">${todayDone ? 'Meta completa' : 'Pendiente'}</span></div><div class="goal-dots">${Array.from({length: 2}, () => `<span class="${todayDone ? 'filled' : ''}"></span>`).join('')}</div></section>
      <section class="detail-panel"><div class="section-head"><div><p class="eyebrow">ESTA SEMANA</p><h2>Tu ritmo propio</h2></div></div><div class="detail-week">${days}</div></section>
      <div class="mini-stats"><div><b>${habitStreak(habit)}</b><small>Días de racha</small></div><div><b>${doneCount}</b><small>Veces realizado</small></div><div><b>${rate}%</b><small>Este mes</small></div></div>
      <div class="character-message"><p>“Cada paso cuenta para una mejor versión.”</p></div>
      <button class="button button-pink button-wide" data-action="toggle-habit" data-id="${escapeHtml(habit.id)}">${todayDone ? 'DESMARCAR HOY' : '¡LO LOGRÉ HOY!'}</button>
      <div class="detail-actions"><button data-action="edit-habit" data-id="${escapeHtml(habit.id)}">Editar hábito</button><button class="danger-text" data-action="delete-habit" data-id="${escapeHtml(habit.id)}">Eliminar</button></div>`);
  }
  function weekDaysDetail(habit) {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - (today.getDay() + 6) % 7);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start); date.setDate(start.getDate() + index);
      const done = completionsFor(todayKey(date)).includes(habit.id);
      return `<span class="${done ? 'done' : ''} ${todayKey(date) === todayKey() ? 'today' : ''}">${new Intl.DateTimeFormat('es-AR', { weekday: 'narrow' }).format(date).toLocaleUpperCase('es-AR')}</span>`;
    }).join('');
  }
  function habitDaysScheduled(habit) {
    const year = new Date().getFullYear(), month = new Date().getMonth();
    const today = new Date();
    let days = 0;
    for (let d = 1; d <= new Date(year, month + 1, 0).getDate(); d++) {
      const date = new Date(year, month, d);
      if (date <= today && scheduled(habit, date)) days++;
    }
    return days;
  }
  function habitMonthlyDoneCount(id) {
    const now = new Date();
    const habit = state.habits.find((item) => item.id === id);
    if (habit && habit.frequency === 'Semanal') {
      const weeks = new Set();
      Object.entries(state.completions).forEach(([key, ids]) => {
        const date = dateFromKey(key);
        if (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && ids.includes(id)) {
          const [start] = weekBounds(date);
          weeks.add(todayKey(start));
        }
      });
      return weeks.size;
    }
    return Object.entries(state.completions).reduce((sum, [key, ids]) => {
      const date = dateFromKey(key);
      return sum + (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && ids.includes(id) ? 1 : 0);
    }, 0);
  }
  function habitStreak(habit) {
    const cursor = new Date();
    if (!completionsFor(todayKey(cursor)).includes(habit.id)) cursor.setDate(cursor.getDate() - 1);
    let count = 0;
    while (completionsFor(todayKey(cursor)).includes(habit.id)) { count++; cursor.setDate(cursor.getDate() - 1); }
    return count;
  }
  function categoryName(id) { return (CATEGORIES.find((item) => item[1] === id) || ['Bienestar'])[0]; }

  function renderCreateHabit() {
    const editing = route === 'edit-habit';
    const existing = editing ? state.habits.find((habit) => habit.id === routeData.id) : null;
    if (editing && !existing) { navigate('home', {}, true); return; }
    const value = existing || { name: '', description: '', category: 'salud', character: 'pink', color: 'pink', target: '', frequency: 'Diario', weekdays: [0,1,2,3,4,5,6], time: '', reminder: false };
    const weekdays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    screen(`${topbar(editing ? 'Editar hábito' : 'Crear hábito')}<div class="page-heading"><p class="eyebrow">UN PASO A LA VEZ</p><h1>${editing ? 'Ajustá tu hábito' : 'Creá tu hábito'}<span class="pink-dot">.</span></h1><p>Elegí algo pequeño que te haga bien.</p></div>
      <form class="habit-form" id="habit-editor" data-edit="${editing ? escapeHtml(value.id) : ''}">
        <label class="field-label" for="habit-name">¿Qué hábito querés crear?</label><input id="habit-name" name="name" maxlength="42" required placeholder="Ej. Meditar, leer, hacer ejercicio..." value="${escapeHtml(value.name)}">
        <label class="field-label" for="habit-description">Una intención para vos <span>opcional</span></label><textarea id="habit-description" name="description" rows="2" maxlength="100" placeholder="¿Qué te aporta este hábito?">${escapeHtml(value.description || '')}</textarea>
        <fieldset class="choice-field"><legend>Categoría</legend><div class="category-grid">${CATEGORIES.map(([name, id, color]) => `<label class="category-choice ${value.category === id ? 'selected' : ''}" style="--category:${COLORS[color]}"><input type="radio" name="category" value="${id}" ${value.category === id ? 'checked' : ''}><span>${categoryIcon(id)}</span><b>${name}</b></label>`).join('')}</div></fieldset>
        <fieldset class="choice-field"><legend>Elegí un personaje</legend><div class="character-choices">${TYPES.filter((type) => type !== 'black').map((type) => `<label class="character-choice ${value.character === type ? 'selected' : ''}"><input type="radio" name="character" value="${type}" ${value.character === type ? 'checked' : ''}>${character(type, 'sm')}</label>`).join('')}</div></fieldset>
        <fieldset class="choice-field"><legend>Frecuencia</legend><div class="segmented">${['Diario', 'Semanal', 'Días específicos'].map((freq) => `<label class="${value.frequency === freq ? 'selected' : ''}"><input type="radio" name="frequency" value="${freq}" ${value.frequency === freq ? 'checked' : ''}>${freq}</label>`).join('')}</div><div class="weekday-choices" ${value.frequency === 'Días específicos' ? '' : 'hidden'}>${weekdays.map((day, i) => `<label><input type="checkbox" name="weekdays" value="${i}" ${value.weekdays.includes(i) ? 'checked' : ''}><span>${day}</span></label>`).join('')}</div></fieldset>
        <div class="form-pair"><label><span class="field-label">Meta</span><input name="target" maxlength="32" placeholder="Ej. 2 vasos" value="${escapeHtml(value.target || '')}"></label><label><span class="field-label">Horario <small>opcional</small></span><input type="time" name="time" value="${escapeHtml(value.time || '')}"></label></div>
        <label class="toggle-row"><span><b>Recordatorio</b><small>Un empujoncito amable</small></span><input name="reminder" type="checkbox" ${value.reminder ? 'checked' : ''}><i></i></label>
        <div class="color-picks"><span class="field-label">Color de identificación</span>${['pink','lime','orange','blue'].map((color) => `<label><input type="radio" name="color" value="${color}" ${value.color === color ? 'checked' : ''}><i style="--swatch:${COLORS[color]}"></i></label>`).join('')}</div>
        <button class="button button-pink button-wide" type="submit">${editing ? 'GUARDAR CAMBIOS' : 'CREAR HÁBITO'}</button>
      </form>`);
  }
  function categoryIcon(id) {
    const symbols = { salud: '♡', ejercicio: '↗', estudio: '✎', bienestar: '✦', sueno: '☾', social: '⌣', creatividad: '✳', finanzas: '$', ambiente: '♧' };
    return symbols[id] || '✦';
  }

  function aggregateForDate(date) {
    const key = todayKey(date);
    return (state.completions[key] || []).filter((id) => state.habits.some((habit) => habit.id === id)).length;
  }
  function getPeriodData() {
    const now = new Date();
    if (statsPeriod === 'semana') {
      const monday = new Date(now); monday.setDate(now.getDate() - (now.getDay() + 6) % 7);
      return Array.from({ length: 7 }, (_, i) => { const date = new Date(monday); date.setDate(monday.getDate() + i); return { label: new Intl.DateTimeFormat('es-AR', { weekday: 'narrow' }).format(date), value: aggregateForDate(date), date }; });
    }
    if (statsPeriod === 'mes') {
      return Array.from({ length: 14 }, (_, i) => { const date = new Date(now); date.setDate(now.getDate() - 13 + i); return { label: String(date.getDate()), value: aggregateForDate(date), date }; });
    }
    return Array.from({ length: 12 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      let total = 0;
      Object.entries(state.completions).forEach(([key, ids]) => { const item = dateFromKey(key); if (item.getFullYear() === date.getFullYear() && item.getMonth() === date.getMonth()) total += ids.length; });
      return { label: new Intl.DateTimeFormat('es-AR', { month: 'narrow' }).format(date), value: total, date };
    });
  }
  function allCompleted() { return Object.values(state.completions).reduce((sum, ids) => sum + ids.filter((id) => state.habits.some((habit) => habit.id === id)).length, 0); }
  function overallRate() {
    if (!state.habits.length) return 0;
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    const firstCreated = Math.min(...state.habits.map((habit) => new Date(habit.createdAt || today).getTime()));
    if (Number.isFinite(firstCreated) && firstCreated > start.getTime()) start.setTime(firstCreated);
    let expected = 0;
    let completed = 0;
    state.habits.forEach((habit) => {
      const created = new Date(habit.createdAt || start);
      if (habit.frequency === 'Semanal') {
        const firstCreatedDate = new Date(habit.createdAt || today);
        const cursor = weekBounds(start)[0];
        while (cursor <= today) {
          const end = weekBounds(cursor)[1];
          if (end >= firstCreatedDate) {
            expected++;
            if (weekHasCompletion(habit.id, created > cursor ? created : cursor, end)) completed++;
          }
          cursor.setDate(cursor.getDate() + 7);
        }
        return;
      }
      const cursor = new Date(start);
      while (cursor <= today) {
        if (cursor >= created && scheduled(habit, cursor)) {
          expected++;
          if (completionsFor(todayKey(cursor)).includes(habit.id)) completed++;
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    });
    return expected ? Math.min(100, Math.round(completed / expected * 100)) : 0;
  }
  function renderProgress() {
    const data = getPeriodData();
    const max = Math.max(1, ...data.map((item) => item.value));
    const allTime = allCompleted();
    const labels = ['semana', 'mes', 'año'];
    const chart = data.map((item) => `<div class="chart-column" title="${escapeHtml(item.label)}: ${item.value} hábito(s)"><div class="bar-track"><i style="height:${item.value ? Math.max(7, item.value / max * 100) : 3}px" class="${item.value ? 'has-value' : ''}"></i></div><small>${escapeHtml(item.label)}</small></div>`).join('');
    screen(`${topbar('Mi progreso')}<div class="page-heading"><p class="eyebrow">MIRÁ TODO LO QUE AVANZASTE</p><h1>Mi progreso<span class="pink-dot">.</span></h1><p>Tu camino se construye a tu ritmo.</p></div>
      <div class="segmented period-tabs">${labels.map((period) => `<button data-action="period" data-value="${period}" class="${statsPeriod === period ? 'selected' : ''}">${period[0].toUpperCase()}${period.slice(1)}</button>`).join('')}</div>
      <div class="stats-cards"><div class="stats-card pink-card"><span>✦</span><small>RACHA ACTUAL</small><b>${streakCount()} <i>días</i></b></div><div class="stats-card orange-card"><span>↗</span><small>COMPLETADOS</small><b>${allTime}</b></div><div class="stats-card blue-card"><span>♡</span><small>CUMPLIMIENTO</small><b>${overallRate()}<i>%</i></b></div></div>
      <section class="panel chart-panel"><div class="section-head"><div><p class="eyebrow">TU HISTORIAL</p><h2>${statsPeriod === 'semana' ? 'Esta semana' : statsPeriod === 'mes' ? 'Últimos 14 días' : 'Este año'}</h2></div></div><div class="bar-chart">${chart}</div></section>
      <div class="character-message"><p>“La constancia siempre gana.”</p></div>
      <section class="panel history-panel"><div class="section-head"><div><p class="eyebrow">ACTIVIDAD RECIENTE</p><h2>Tus pasos cuentan</h2></div></div>${historyRows()}</section>
      <button class="button button-dark button-wide" data-go="rewards">Ver mis recompensas <span>→</span></button>`);
  }
  function historyRows() {
    const rows = Object.entries(state.completions).map(([date, ids]) => [date, ids.filter((id) => state.habits.some((habit) => habit.id === id))]).filter(([, ids]) => ids.length).sort(([a], [b]) => b.localeCompare(a)).slice(0, 6);
    if (!rows.length) return '<p class="soft-copy">Cuando marques un hábito, acá vas a ver tu camino.</p>';
    return rows.map(([date, ids]) => `<div class="history-row"><span>${escapeHtml(displayDate(dateFromKey(date), { weekday: 'short', day: 'numeric', month: 'short' }))}</span><b>${ids.length} ${ids.length === 1 ? 'hábito' : 'hábitos'}</b></div>`).join('');
  }

  const ACHIEVEMENTS = [
    { id: 'first', name: 'Primer paso', desc: 'Completá tu primer hábito.', test: () => allCompleted() >= 1, icon: '✦' },
    { id: 'week', name: 'Semana completa', desc: 'Sumá 7 días con algún hábito.', test: () => distinctCompletionDays() >= 7, icon: '7' },
    { id: 'streak', name: 'Racha de 7', desc: 'Mantené una racha de 7 días.', test: () => streakCount() >= 7, icon: '↗' },
    { id: 'water', name: 'Hidratación total', desc: 'Completá Beber agua 10 veces.', test: () => habitDoneTotal('water') >= 10, icon: '♧' },
    { id: 'reader', name: 'Lector constante', desc: 'Completá Leer un poco 10 veces.', test: () => habitDoneTotal('read') >= 10, icon: '✎' },
    { id: 'moves', name: 'Movimiento', desc: 'Completá un hábito de ejercicio 10 veces.', test: () => state.habits.filter((h) => h.category === 'ejercicio').some((h) => habitDoneTotal(h.id) >= 10), icon: '♡' }
  ];
  function distinctCompletionDays() { return Object.values(state.completions).filter((ids) => ids.some((id) => state.habits.some((habit) => habit.id === id))).length; }
  function habitDoneTotal(id) { return Object.values(state.completions).filter((ids) => ids.includes(id)).length; }
  function unlockedAchievements() { return ACHIEVEMENTS.filter((item) => item.test()); }
  function renderRewards() {
    const tabs = ['logros', 'insignias', 'niveles'];
    const unlocked = unlockedAchievements();
    let content;
    if (rewardTab === 'logros') content = ACHIEVEMENTS.map((item) => achievementCard(item, item.test())).join('');
    else if (rewardTab === 'insignias') content = `<div class="badge-grid">${ACHIEVEMENTS.map((item) => `<div class="badge-item ${item.test() ? 'unlocked' : 'locked'}"><span>${item.test() ? item.icon : '· · ·'}</span><b>${escapeHtml(item.name)}</b><small>${item.test() ? 'Desbloqueada' : 'Seguí avanzando'}</small></div>`).join('')}</div>`;
    else content = `<div class="level-card">${character('lime', 'lg')}<p class="eyebrow">TU NIVEL ACTUAL</p><h2>Nivel ${Math.floor(state.stars / 50) + 1}</h2><p>${state.stars % 50} de 50 estrellas para el próximo nivel</p><div class="level-track"><i style="width:${state.stars % 50 * 2}%"></i></div></div>`;
    screen(`${topbar('Recompensas')}<div class="page-heading reward-heading"><p class="eyebrow">CADA PASO MERECE CELEBRARSE</p><h1>Recompensas<span class="pink-dot">.</span></h1></div><div class="star-wallet">${icon('star')}<span><small>TUS ESTRELLAS</small><b>${state.stars}</b></span><button data-go="store">Canjear →</button></div><div class="reward-banner">${character('lime', 'md')}<div><p class="eyebrow light-eyebrow">TU CONSTANCIA BRILLA</p><b>¡CADA HÁBITO<br>TE ACERCA MÁS!</b></div>${sparkles(3)}</div><div class="segmented reward-tabs">${tabs.map((tab) => `<button class="${rewardTab === tab ? 'selected' : ''}" data-action="reward-tab" data-value="${tab}">${tab[0].toUpperCase()}${tab.slice(1)}</button>`).join('')}</div><div class="achievement-list">${content}</div><p class="demo-hint">${unlocked.length} de ${ACHIEVEMENTS.length} logros desbloqueados · Se calculan con tus hábitos.</p>`);
  }
  function achievementCard(item, unlocked) {
    return `<article class="achievement-card ${unlocked ? 'unlocked' : 'locked'}"><span class="achievement-icon">${unlocked ? item.icon : '✦'}</span><div><b>${escapeHtml(item.name)}</b><small>${escapeHtml(item.desc)}</small></div><span class="achievement-state">${unlocked ? '¡Listo!' : 'En camino'}</span></article>`;
  }

  function productArt(product, large = false) {
    const color = COLORS[product.color] || COLORS.pink;
    if (product.id === 'hoodie') {
      return `<img class="product-photo ${large ? 'large' : ''}" src="assets/productos/hoodie-kivo.png" alt="Hoodie KIVO beige con estampado en la espalda" />`;
    }
    if (product.id === 'tote') {
      return `<img class="product-photo ${large ? 'large' : ''}" src="assets/productos/tote-bag-kivo.png" alt="Tote bag KIVO negra con personajes originales" />`;
    }
    if (product.id === 'notebook') {
      return `<img class="product-photo ${large ? 'large' : ''}" src="assets/productos/cuaderno-kivo.png" alt="Cuaderno KIVO negro con personajes originales" />`;
    }
    if (product.id === 'stickers') {
      return `<img class="product-photo ${large ? 'large' : ''}" src="assets/productos/stickers-kivo.png" alt="Stickers originales de KIVO con personajes" />`;
    }
    if (product.id === 'keyring') {
      return `<img class="product-photo ${large ? 'large' : ''}" src="assets/productos/llavero-kivo.png" alt="Llavero original KIVO con personajes" />`;
    }
    if (product.id === 'bundle') {
      return `<img class="product-photo ${large ? 'large' : ''}" src="assets/productos/kit-celebracion-kivo.png" alt="Kit de celebración original KIVO" />`;
    }
    const design = '<rect x="25" y="25" width="50" height="53" rx="10" fill="#00a8ff"/><path d="m32 46 8-8 8 8m5 7 8-10 10 10" fill="none" stroke="#e4ff00" stroke-width="4"/><text x="50" y="72" text-anchor="middle" font-size="8" font-weight="800">KIVO</text>';
    return `<svg class="product-art ${large ? 'large' : ''}" viewBox="0 0 100 100" role="img" aria-label="Ilustración de muestra de ${escapeHtml(product.name)}"><rect x="4" y="4" width="92" height="92" rx="27" fill="${color}" opacity=".18"/>${design}</svg>`;
  }
  function renderStore() {
    const types = ['todos', 'ropa', 'accesorios', 'papeleria'];
    const products = PRODUCTS.filter((product) => storeTab === 'todos' || product.type === storeTab);
    screen(`${topbar('Tienda KIVO')}<div class="page-heading"><p class="eyebrow">TUS LOGROS SE VUELVEN PREMIOS</p><h1>Tienda KIVO<span class="pink-dot">.</span></h1><p>Tus pequeños logros se convierten en grandes premios.</p></div><div class="store-wallet">${icon('star')}<span><small>ESTRELLAS DISPONIBLES</small><b>${state.stars}</b></span><button data-go="rewards">Ver logros</button></div>
      <div class="store-banner"><div><p class="eyebrow light-eyebrow">HECHO PARA CELEBRARTE</p><b>¡CANJEÁ TUS<br>ESTRELLAS!</b><button data-action="store-scroll">VER PREMIOS</button></div><div class="banner-characters">${character('orange', 'sm')}${character('blue', 'sm')}</div></div>
      <div class="segmented store-tabs">${types.map((type) => `<button class="${storeTab === type ? 'selected' : ''}" data-action="store-tab" data-value="${type}">${type === 'papeleria' ? 'Papelería' : type[0].toUpperCase() + type.slice(1)}</button>`).join('')}</div><div class="product-grid" id="store-products">${products.map((product) => `<button class="product-card" data-go="product-detail" data-id="${product.id}">${productArt(product)}<span class="product-info"><b>${escapeHtml(product.name)}</b><small>${icon('star')} ${product.price} estrellas</small></span><span class="product-arrow">→</span></button>`).join('')}</div><p class="demo-hint">Productos ilustrados de muestra · Canjes simulados, sin compras reales.</p>`);
  }
  function renderProductDetail() {
    const product = PRODUCTS.find((item) => item.id === routeData.id) || PRODUCTS[0];
    screen(`${topbar('Detalle del premio')}<div class="product-detail-art" style="--product-color:${COLORS[product.color]}">${productArt(product, true)}<span>PREMIO KIVO</span></div><div class="product-detail-copy"><p class="eyebrow">UN PREMIO PARA VOS</p><h1>${escapeHtml(product.name)}<span class="pink-dot">.</span></h1><div class="price-line">${icon('star')}<b>${product.price} estrellas</b></div><p>${escapeHtml(product.detail)}</p><div class="feature-list"><span>✦ Un mimo para celebrar tu constancia</span><span>✦ Canje de muestra dentro de KIVO</span><span>✦ No se realizan compras reales</span></div><button class="button button-pink button-wide" data-action="redeem" data-id="${product.id}">CANJEAR PREMIO</button>${state.stars < product.price ? `<p class="need-stars">Te faltan ${product.price - state.stars} estrellas para este premio.</p>` : ''}</div>`);
  }

  function renderCommunity() {
    const tabs = ['todos', 'amigos', 'cercanos'];
    const posts = state.posts.filter((post) => feedTab === 'todos' || (feedTab === 'amigos' && !post.demo) || (feedTab === 'cercanos' && post.demo));
    screen(`${topbar('Comunidad', false)}<div class="page-heading"><p class="eyebrow">ACOMPAÑARNOS TAMBIÉN SUMA</p><h1>Comunidad<span class="pink-dot">.</span></h1><p>Crecer juntos también es parte del camino.</p></div><div class="segmented feed-tabs">${tabs.map((tab) => `<button class="${feedTab === tab ? 'selected' : ''}" data-action="feed-tab" data-value="${tab}">${tab[0].toUpperCase()}${tab.slice(1)}</button>`).join('')}</div><button class="compose-button" data-action="new-post"><span>+</span> Compartí tu pequeño gran paso</button><div class="post-list">${posts.length ? posts.map((post) => postCard(post)).join('') : '<div class="empty-state compact-empty"><p>Acá todavía no hay publicaciones de este grupo.</p><span>Si querés, compartí tu primer avance.</span></div>'}</div><p class="demo-hint">Publicaciones locales de demostración · No hay conexión con otros usuarios.</p>`);
  }
  function postCard(post) {
    const liked = state.likes.includes(post.id);
    return `<article class="post-card"><header><span class="post-avatar">${character(post.character || 'pink', 'xs')}</span><span class="post-author"><b>${escapeHtml(post.name)}</b><small>${escapeHtml(post.date)}${post.demo ? ' · ejemplo' : ''}</small></span><button class="post-menu" aria-label="Más opciones">···</button></header><p class="post-copy">${escapeHtml(post.text)}</p><div class="post-reaction-row"><button class="like-button ${liked ? 'liked' : ''}" data-action="like" data-id="${escapeHtml(post.id)}">${icon('heart')} ${post.likes + (liked ? 1 : 0)}</button><button class="comment-button" data-action="comments" data-id="${escapeHtml(post.id)}">♡ ${post.comments.length} comentarios</button><span>♡</span></div></article>`;
  }

  function renderProfile() {
    const badges = unlockedAchievements().slice(0, 3);
    const inventory = state.inventory.map((id) => {
      const product = PRODUCTS.find((item) => item.id === id);
      return product ? product.name : 'Sticker sorpresa';
    }).join(', ');
    screen(`${topbar('Mi perfil', false)}<div class="profile-hero">${character(state.character, 'lg', 'profile-character')}<div><p class="eyebrow">ESTE ESPACIO ES TUYO</p><h1>${escapeHtml(state.name || 'Zoe')}</h1><p>@${escapeHtml(state.username || 'kivo')}</p><button data-action="edit-profile">Editar perfil</button></div><button class="settings-button" data-go="sound-settings" aria-label="Sonidos y música">⚙</button></div>
      <div class="profile-stats"><div><b>${state.habits.length}</b><small>Hábitos activos</small></div><div><b>${streakCount()}</b><small>Días de racha</small></div><div><b>${overallRate()}%</b><small>Cumplimiento</small></div></div>
      <section class="panel profile-badges"><div class="section-head"><div><p class="eyebrow">CADA PASO SE CELEBRA</p><h2>Mis insignias</h2></div><button class="text-link" data-go="rewards">Ver todas →</button></div>${badges.length ? `<div class="badge-strip">${badges.map((item) => `<div><span>${item.icon}</span><small>${escapeHtml(item.name)}</small></div>`).join('')}</div>` : '<p class="soft-copy">Tu primera insignia está más cerca de lo que pensás.</p>'}</section>
      <div class="character-message">${character('blue', 'sm')}<p>“Un día a la vez, siempre algo más.”</p></div>
      <button class="instagram-profile-card" data-action="open-instagram" aria-label="Abrir Instagram oficial de KIVO"><span class="instagram-mark"><i></i></span><span><b>Seguinos en Instagram</b><small>@somoskivoapp</small></span><i class="instagram-arrow">↗</i></button>
      <div class="menu-list">${menuRow('Mis recompensas', '✦', 'rewards')}${menuRow('Tienda KIVO', '▧', 'store')}${menuRow('Sorpresa diaria', '♡', 'surprise')}${menuRow('Frases KIVO', '“', 'phrases-kivo')}${menuRow('Personalizar personaje', '✳', 'customize')}${menuRow('Zona de juegos', '▶', 'play-select')}${menuRow('Sonidos y música', '♫', 'sound-settings')}<button class="menu-row" data-action="reset"><span>↻</span><b>Reiniciar demostración</b><i>→</i></button></div>
      ${inventory ? `<section class="panel inventory-panel"><div class="section-head"><div><p class="eyebrow">PREMIOS CANJEADOS</p><h2>Tu inventario</h2></div></div><p class="soft-copy">${escapeHtml(inventory)}</p></section>` : ''}<p class="demo-hint">Tu perfil y progreso se guardan en este dispositivo.</p>`);
  }
  function menuRow(label, symbol, target) { return `<button class="menu-row" data-go="${target}"><span>${symbol}</span><b>${label}</b><i>→</i></button>`; }
  function renderSoundSettings(){
    screen(`<section class="sound-settings-page"><header class="sound-settings-top"><button class="back-button light-back" data-action="back" aria-label="Volver">‹</button><div><span>Κ</span><b>KIVO</b></div><button class="sound-settings-stars" data-go="rewards">★ ${state.stars}</button></header><div class="sound-settings-heading"><span class="sound-headphones">🎧</span><div><p>Personalizá tu experiencia</p><h1>Sonidos<br><em>y música.</em></h1></div></div><div class="sound-settings-panel"><label class="sound-toggle-row"><span class="sound-row-icon music-icon">♫</span><span><b>Música de los juegos</b><small>Melodías originales en KIVO JUMP.</small></span><input class="sound-switch" type="checkbox" data-setting="music" ${state.music?'checked':''}><i></i></label><label class="sound-toggle-row"><span class="sound-row-icon effects-icon">◖◗</span><span><b>Efectos de sonido</b><small>Sonidos en botones, logros y sorpresas.</small></span><input class="sound-switch" type="checkbox" data-setting="effects" ${state.effects?'checked':''}><i></i></label><div class="sound-volume"><div><span class="sound-row-icon volume-icon">▮▮</span><span><b>Volumen general</b><small>Musica y efectos</small></span><strong>${state.volume}%</strong></div><input class="sound-range" type="range" min="0" max="100" value="${state.volume}" data-setting="volume" aria-label="Volumen general"></div><p class="sound-info">ℹ La música se activa sólo después de jugar y respeta esta configuración.</p></div><button class="instagram-profile-card sound-instagram" data-action="open-instagram"><span class="instagram-mark"><i></i></span><span><b>Seguinos en Instagram</b><small>Novedades y más del universo KIVO.</small></span><i class="instagram-arrow">↗</i></button></section>`, 'sound-settings-screen');
  }

  function todaysSurprise() {
    const key = todayKey();
    if (state.surpriseDays[key]) return state.surpriseDays[key];
    const prizes = [
      { type: 'stars', amount: 5, title: '¡5 estrellas KIVO!', description: 'Un poquito más de brillo para tu camino.' },
      { type: 'stars', amount: 10, title: '¡10 estrellas KIVO!', description: 'Cada pequeño paso merece una alegría.' },
      { type: 'sticker', amount: 0, title: 'Sticker especial', description: 'Un detalle para celebrar que estás acá.' },
      { type: 'phrase', amount: 0, title: 'Un mensaje para vos', description: 'Tu progreso no necesita ser perfecto para ser valioso.' }
    ];
    const seed = [...key].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return prizes[seed % prizes.length];
  }
  function renderSurprise() {
    const already = state.surpriseDays[todayKey()];
    const prize = already || todaysSurprise();
    const prizeIcon = prize.type === 'stars' ? '★' : prize.type === 'sticker' ? '✦' : '“';
    screen(`${topbar('Sorpresa de hoy', true, true)}<div class="surprise-screen">
      <div class="surprise-heading"><p class="eyebrow"><span>✦</span> KIVO TE GUARDÓ ALGO <span>✦</span></p><h1>Tu sorpresa<br><strong>de hoy.</strong></h1><p>¡Por seguir avanzando,<br>viví la magia!</p></div>
      <div class="gift-stage ${already ? 'opened' : ''}" ${already ? '' : 'data-action="open-surprise" role="button" tabindex="0" aria-label="Abrir la caja sorpresa"'}>
        <div class="prize-reveal ${already ? 'visible' : ''}" aria-live="polite"><b><i>${prizeIcon}</i>${escapeHtml(prize.title)}</b><span>${escapeHtml(prize.description)}</span></div>
        <div class="gift-shadow"></div>
        <div class="gift-box" aria-hidden="true"><div class="gift-lid"></div><div class="gift-bow"><i></i></div><div class="gift-body"></div></div>
      </div>
      <p class="surprise-footnote">${already ? '¡Tu premio ya es tuyo!<br>Seguí avanzando, un día a la vez.' : 'Tocá la caja para descubrir tu premio.'}</p>
      <button class="button surprise-action" data-action="open-surprise">${already ? '¡Genial!' : 'ABRIR SORPRESA'}<span>→</span></button>
    </div>`);
  }

  function renderCustomize() {
    const tabs = ['sombreros', 'gafas', 'fondos'];
    const options = {
      sombreros: ['Ninguno', 'Gorra', 'Halo', 'Moño', 'Corona', 'Sombrero mágico', 'Brillitos', 'Gorro de lana', 'Orejas de conejo', 'Sombrero negro', 'Gorro de fiesta'],
      gafas: ['Ninguna', 'Redondas', 'Corazones', 'Estrellas', 'Anteojos de sol', 'Mariposa', 'Cuadradas', 'Visor azul', 'Ovaladas'],
      fondos: ['blanco', 'rosa', 'amarillo', 'cielo']
    };
    if (!options[customizeTab]) customizeTab = 'sombreros';
    const selectedKey = { sombreros: 'hat', gafas: 'glasses', fondos: 'background' }[customizeTab];
    screen(`${topbar('Tu personaje')}<div class="page-heading"><p class="eyebrow">UN PERSONAJE A TU MANERA</p><h1>Personalizá<br>tu KIVO<span class="pink-dot">.</span></h1><p>Probá combinaciones y elegí la que más te representa.</p></div><div class="custom-preview ${escapeHtml(accessoryPreview.background)}">${character(characterPreview, 'xl', 'preview-character')}${accessoryPreview.hat === 'Ninguno' ? '' : `<span class="preview-accessory preview-hat">${accessoryIcon('sombreros', accessoryPreview.hat)}</span>`}${accessoryPreview.glasses === 'Ninguna' ? '' : `<span class="preview-accessory preview-glasses">${accessoryIcon('gafas', accessoryPreview.glasses)}</span>`}<span class="preview-tag">${escapeHtml(characterPreview)}</span></div>
      <div class="character-choices picker">${TYPES.map((type) => `<button class="${characterPreview === type ? 'selected' : ''}" data-action="pick-character" data-value="${type}" aria-label="Elegir personaje ${type}">${character(type, 'sm')}</button>`).join('')}</div><h2 class="customize-section-title">Elegí una categoría</h2><div class="segmented customize-tabs">${tabs.map((tab) => `<button class="${customizeTab === tab ? 'selected' : ''}" data-action="customize-tab" data-value="${tab}">${tab[0].toUpperCase()}${tab.slice(1)}</button>`).join('')}</div><div class="accessory-options">${options[customizeTab].map((option) => `<button class="${accessoryPreview[selectedKey] === option ? 'selected' : ''}" data-action="accessory" data-key="${selectedKey}" data-value="${option}" aria-pressed="${accessoryPreview[selectedKey] === option}">${accessoryIcon(customizeTab, option)}<span>${escapeHtml(option)}</span></button>`).join('')}</div><button class="button button-pink button-wide" data-action="save-character">GUARDAR PERSONAJE</button><p class="demo-hint">Accesorios de muestra · El personaje elegido aparece también en tu perfil.</p>`);
  }
  function accessoryIcon(tab, option) {
    if (tab === 'fondos') return `<i class="accessory-background ${option}"></i>`;
    if (option === 'Ninguno' || option === 'Ninguna') return '<i class="accessory-none" aria-hidden="true">—</i>';
    const hats = {
      Gorra: '<path d="M17 37c4-15 16-23 32-23 13 0 23 7 28 20-11 0-19 2-27 8-12-7-22-8-33-5Z"/><path d="M18 38c-7 0-11 4-11 9 0 3 3 5 7 5h49c11 0 19-4 19-9 0-3-5-6-12-7"/>',
      Halo: '<ellipse cx="50" cy="31" rx="33" ry="12"/><path d="M24 37c8 5 16 7 26 7s18-2 26-7"/>',
      Moño: '<path d="M49 32 19 18c-6-3-11 1-10 8l3 20c1 6 6 8 11 5l27-14 27 14c5 3 10 1 11-5l3-20c1-7-4-11-10-8L51 32Z"/><circle cx="50" cy="34" r="8"/>',
      Corona: '<path d="m13 26 20 12 17-25 17 25 20-12-7 39H20l-7-39Z"/><path d="M20 65h60"/>',
      'Sombrero mágico': '<path d="m18 48 20-33c4-7 10-7 14 0l20 33-4 8H22l-4-8Z"/><ellipse cx="50" cy="57" rx="39" ry="9"/><path d="m46 31 5 6-7 4 9 6"/>',
      'Sombrero negro': '<path d="M22 51c2-15 12-25 28-25s26 10 28 25H22Z"/><path d="M14 51h72c5 0 8 3 8 7s-4 8-10 8H16c-6 0-10-4-10-8s3-7 8-7Z"/>',
      'Gorro de fiesta': '<path d="m20 58 24-47c3-7 9-7 12 0l24 47H20Z"/><path d="M16 58h68v9H16z"/><circle cx="50" cy="7" r="5"/>',
      Brillitos: '<path d="M28 12v30M13 27h30m-25-10 21 21M39 17 18 38" class="sparkle-line"/><path d="M72 37v20M62 47h20m-17-7 14 14m0-14L65 54" class="sparkle-line"/>',
      'Gorro de lana': '<path d="M18 43c0-20 13-32 32-32s32 12 32 32v12H18V43Z"/><path d="M14 43h72v13H14zM50 11V4"/>',
      'Orejas de conejo': '<path d="M30 43c-8-19-9-35 0-38 10-3 15 18 18 37m5 1c1-21 7-39 17-38 10 2 6 21 0 39"/><path d="M34 38c-4-13-5-21-2-22m27 22c3-14 6-22 9-22"/>'
    };
    const glasses = {
      Redondas: '<circle cx="28" cy="34" r="17"/><circle cx="72" cy="34" r="17"/><path d="M45 32c3-5 7-5 10 0M11 31 3 28m86 3 8-3"/>',
      Corazones: '<path d="M27 51 9 33C-1 22 15 8 27 21 39 8 55 22 45 33L27 51Zm46 0L55 33C45 22 61 8 73 21 85 8 101 22 91 33L73 51Z"/>',
      Estrellas: '<path d="m27 12 6 14 15 1-11 10 4 15-14-8-13 8 3-15L5 27l15-1 7-14Zm46 0 6 14 15 1-11 10 4 15-14-8-13 8 3-15-11-10 15-1 6-14Z"/>',
      'Anteojos de sol': '<path d="M8 22h35l-3 24c-1 8-8 12-17 10C12 54 8 46 8 22Zm49 0h35c0 24-4 32-15 34-9 2-16-2-17-10l-3-24ZM43 29c4-4 10-4 14 0"/>',
      Mariposa: '<path d="M10 19c14-8 25-2 31 10-6 15-18 25-31 18-11-6-11-22 0-28Zm80 0c-14-8-25-2-31 10 6 15 18 25 31 18 11-6 11-22 0-28ZM41 29c5-4 13-4 18 0m-18 8c5 4 13 4 18 0"/>',
      Cuadradas: '<rect x="7" y="18" width="36" height="34" rx="6"/><rect x="57" y="18" width="36" height="34" rx="6"/><path d="M43 28c4-4 10-4 14 0M7 29 1 26m92 3 6-3"/>',
      'Visor azul': '<path d="M8 23h84l-8 25c-3 9-14 13-33 13S21 57 18 48L8 23Z"/>',
      Ovaladas: '<ellipse cx="27" cy="35" rx="21" ry="13"/><ellipse cx="73" cy="35" rx="21" ry="13"/><path d="M48 33c1-4 3-5 5-5m-74 5-5-3m92 3 5-3"/>'
    };
    const paths = tab === 'sombreros' ? hats[option] : glasses[option];
    const className = `${tab === 'sombreros' ? 'hat' : 'glasses'} accessory-art-${option.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    return `<svg class="accessory-art ${className}" viewBox="0 0 100 70" aria-hidden="true">${paths}</svg>`;
  }

  function toggleHabit(id) {
    const habit = state.habits.find((item) => item.id === id);
    if (!habit) return;
    const key = todayKey();
    const current = completionsFor(key);
    const done = current.includes(id);
    state.completions[key] = done ? current.filter((item) => item !== id) : [...current, id];
    const award = state.starAwards[key] || [];
    const shouldAward = !done && !award.includes(id);
    if (shouldAward) {
      state.stars += 1;
      state.starAwards[key] = [...award, id];
    }
    const saved = save();
    render();
    if (!done && saved) {
      celebrate();
      toast(shouldAward ? '¡Sumaste una estrella! Cada día cuenta.' : '¡Lo lograste! Tu progreso continúa.');
      if (window.KivoAudio && state.effects) { window.KivoAudio.effect('habit'); window.KivoAudio.effect('star'); }
    } else if (done && saved) toast('Listo, actualizamos tu día.');
  }
  function celebrate() {
    const holder = document.createElement('div');
    holder.className = 'confetti';
    holder.innerHTML = Array.from({ length: 18 }, (_, i) => `<i style="--i:${i};--c:${Object.values(COLORS)[i % 5]}"></i>`).join('');
    document.body.append(holder);
    setTimeout(() => holder.remove(), 1300);
  }
  function playTone(frequency = 600, duration = .12) {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.035, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + duration);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.start(); oscillator.stop(context.currentTime + duration);
      oscillator.addEventListener('ended', () => context.close(), { once: true });
    } catch (error) {
      console.error('No se pudo reproducir el sonido opcional:', error);
    }
  }

  function openModal(content) {
    modalRoot.innerHTML = `<div class="modal-backdrop" data-action="close-modal"><section class="modal-card" role="dialog" aria-modal="true">${content}</section></div>`;
    const first = $('input, textarea, button', modalRoot);
    if (first) first.focus();
  }
  function closeModal() { modalRoot.replaceChildren(); }
  function editProfileModal() {
    openModal(`<button class="modal-close" data-action="close-modal">${icon('close')}</button><p class="eyebrow">TU PERFIL</p><h2>Un nombre bien tuyo.</h2><form id="profile-editor"><label>Nombre<input name="name" maxlength="24" required value="${escapeHtml(state.name)}"></label><label>Usuario<input name="username" maxlength="24" pattern="[A-Za-z0-9_]+" value="${escapeHtml(state.username)}"></label><button class="button button-pink button-wide">GUARDAR</button></form>`);
  }
  function settingsModal() {
    openModal(`<button class="modal-close" data-action="close-modal">${icon('close')}</button><p class="eyebrow">KIVO, A TU MANERA</p><h2>Configuración</h2><label class="toggle-row"><span><b>Sonidos</b><small>Efectos sutiles después de tocar</small></span><input type="checkbox" data-action="sound-toggle" ${state.sound ? 'checked' : ''}><i></i></label><button class="button button-dark button-wide" data-action="close-modal">Listo</button>`);
  }
  function commentsModal(id) {
    const post = state.posts.find((item) => item.id === id);
    if (!post) return;
    openModal(`<button class="modal-close" data-action="close-modal">${icon('close')}</button><p class="eyebrow">CONVERSACIÓN</p><h2>Unos mensajes lindos.</h2><div class="comment-list">${post.comments.map((comment) => `<p><b>Alguien de KIVO</b>${escapeHtml(comment)}</p>`).join('') || '<p class="soft-copy">Sé la primera persona en dejar un mensaje amable.</p>'}</div><form id="comment-form" data-id="${escapeHtml(id)}"><textarea name="comment" maxlength="140" placeholder="Dejá un mensaje amable..." required></textarea><button class="button button-pink button-wide">ENVIAR</button></form>`);
  }
  function newPostModal() {
    openModal(`<button class="modal-close" data-action="close-modal">${icon('close')}</button><p class="eyebrow">COMPARTÍ TU CAMINO</p><h2>¿Qué pequeño paso diste?</h2><form id="post-form"><textarea name="text" maxlength="240" rows="4" placeholder="Cada día suma..." required></textarea><button class="button button-pink button-wide">PUBLICAR</button></form><p class="modal-note">Tu publicación queda guardada solo en este dispositivo.</p>`);
  }
  function confirmModal(title, message, confirmAction, data = {}) {
    openModal(`<button class="modal-close" data-action="close-modal">${icon('close')}</button><p class="eyebrow">UN MOMENTO</p><h2>${escapeHtml(title)}</h2><p class="modal-copy">${escapeHtml(message)}</p><div class="modal-actions"><button class="button button-outline" data-action="close-modal">Volver</button><button class="button button-pink" data-action="${confirmAction}" ${Object.entries(data).map(([key, value]) => `data-${key}="${escapeHtml(value)}"`).join(' ')}>Confirmar</button></div>`);
  }
  function redeemProduct(id) {
    const product = PRODUCTS.find((item) => item.id === id);
    if (!product) return;
    if (state.stars < product.price) {
      toast(`Te faltan ${product.price - state.stars} estrellas para este premio.`);
      return;
    }
    confirmModal('¿Canjeamos este premio?', `${product.name} cuesta ${product.price} estrellas. El canje es una simulación local.`, 'confirm-redeem', { id });
  }
  function finishRedeem(id) {
    const product = PRODUCTS.find((item) => item.id === id);
    if (!product || state.stars < product.price) { closeModal(); toast('No alcanzan las estrellas para este premio.'); return; }
    state.stars -= product.price;
    state.redeemed.push({ id: product.id, date: todayKey() });
    state.inventory.push(product.id);
    const saved = save();
    closeModal();
    render();
    if (saved) {
      celebrate();
      toast('¡Premio canjeado! Quedó en tu inventario.');
      if (window.KivoAudio && state.effects) window.KivoAudio.effect('reward');
    }
  }
  function openSurprise() {
    const key = todayKey();
    if (state.surpriseDays[key]) { toast('Tu sorpresa de hoy ya está abierta.'); return; }
    const prize = todaysSurprise();
    state.surpriseDays[key] = prize;
    if (prize.type === 'stars') state.stars += prize.amount;
    if (prize.type === 'sticker') state.inventory.push('daily-sticker');
    const saved = save();
    render();
    if (saved) {
      celebrate();
      toast(`¡Tu sorpresa: ${prize.title}!`);
      if (window.KivoAudio && state.effects) window.KivoAudio.effect('celebration');
    }
  }
  function addHabit(form) {
    const data = new FormData(form);
    const weekdays = data.getAll('weekdays').map(Number);
    if (data.get('frequency') === 'Días específicos' && weekdays.length === 0) {
      toast('Elegí al menos un día para tu hábito.');
      return;
    }
    const habit = {
      id: `habit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: String(data.get('name') || '').trim(),
      description: String(data.get('description') || '').trim(),
      category: data.get('category') || 'bienestar',
      character: data.get('character') || 'pink',
      color: data.get('color') || 'pink',
      target: String(data.get('target') || '').trim(),
      frequency: data.get('frequency') || 'Diario',
      weekdays: data.get('frequency') === 'Días específicos' ? weekdays : [0,1,2,3,4,5,6],
      time: data.get('time') || '',
      reminder: data.has('reminder'),
      createdAt: new Date().toISOString()
    };
    if (!habit.name) { toast('Poné un nombre para tu hábito.'); return; }
    const editId = form.dataset.edit;
    if (editId) {
      const index = state.habits.findIndex((item) => item.id === editId);
      if (index >= 0) state.habits[index] = { ...state.habits[index], ...habit, id: editId, createdAt: state.habits[index].createdAt };
    } else state.habits.push(habit);
    const saved = save();
    route = editId ? 'habit-detail' : 'home'; routeData = editId ? { id: editId } : {};
    render();
    if (saved) toast(editId ? 'Hábito actualizado.' : '¡Sumaste un nuevo hábito!');
  }
  function deleteHabit(id) {
    const habit = state.habits.find((item) => item.id === id);
    if (!habit) return;
    confirmModal('¿Querés borrar este hábito?', `“${habit.name}” dejará de aparecer. El historial ya registrado se conserva.`, 'confirm-delete', { id });
  }
  function finishDelete(id) {
    state.habits = state.habits.filter((habit) => habit.id !== id);
    const saved = save();
    closeModal(); route = 'home'; routeData = {}; render();
    if (saved) toast('Hábito eliminado.');
  }
  function updatePost(form) {
    const text = String(new FormData(form).get('text') || '').trim();
    if (!text) return;
    state.posts.unshift({ id: `post-${Date.now()}`, name: state.name || 'Zoe', character: state.character, date: 'Ahora', text, likes: 0, comments: [], demo: false });
    const saved = save();
    closeModal(); render();
    if (saved) toast('Tu pequeño gran paso ya está en el feed.');
  }
  function updateComment(form) {
    const data = new FormData(form);
    const post = state.posts.find((item) => item.id === form.dataset.id);
    const comment = String(data.get('comment') || '').trim();
    if (!post || !comment) return;
    post.comments.push(comment);
    if (save()) commentsModal(post.id);
  }
  function resetDemo() {
    confirmModal('¿Empezamos de nuevo?', 'Se reinicia el progreso guardado en este dispositivo. Esta acción no se puede deshacer.', 'confirm-reset');
  }

  document.addEventListener('click', (event) => {
    if (navExpanded && !nav.contains(event.target)) {
      navExpanded = false;
      renderNav();
    }
    const button = event.target.closest('button, [data-go], [data-nav], [data-action]');
    if (!button) return;
    if (button.dataset.nav) {
      if (button.dataset.nav === 'more') {
        navExpanded = !navExpanded;
        renderNav();
        return;
      }
      navigate(button.dataset.nav === 'create-habit' ? 'create-habit' : button.dataset.nav);
      return;
    }
    if (button.dataset.go) { navigate(button.dataset.go, button.dataset.id ? { id: button.dataset.id } : {}); return; }
    const action = button.dataset.action;
    if (!action) return;
    if (window.KivoAudio && action !== 'open-instagram') window.KivoAudio.effect('click');
    if (action === 'open-instagram') { window.open(INSTAGRAM_URL, '_blank', 'noopener,noreferrer'); return; }
    if (action.startsWith('kj-') && window.KivoJump) { window.KivoJump.handleAction(action, button); return; }
    if (action === 'back') goBack();
    else if (action === 'start') navigate('onboarding1');
    else if (action === 'onboarding-next' && route === 'onboarding1') navigate('onboarding2');
    else if (action === 'onboarding-next' && route === 'onboarding2') navigate('onboarding3');
    else if (action === 'onboarding-back') goBack();
    else if (action === 'finish-onboarding') {
      navigate('register');
    }
    else if (action === 'toggle-habit') toggleHabit(button.dataset.id);
    else if (action === 'edit-habit') navigate('edit-habit', { id: button.dataset.id });
    else if (action === 'delete-habit') deleteHabit(button.dataset.id);
    else if (action === 'period') { statsPeriod = button.dataset.value; render(); }
    else if (action === 'reward-tab') { rewardTab = button.dataset.value; render(); }
    else if (action === 'store-tab') { storeTab = button.dataset.value; render(); }
    else if (action === 'feed-tab') { feedTab = button.dataset.value; render(); }
    else if (action === 'customize-tab') { customizeTab = button.dataset.value; render(); }
    else if (action === 'pick-character') { characterPreview = button.dataset.value; render(); }
    else if (action === 'accessory') { accessoryPreview[button.dataset.key] = button.dataset.value; render(); }
    else if (action === 'save-character') {
      state.character = characterPreview;
      state.accessory = { ...accessoryPreview };
      const saved = save();
      render();
      if (saved) toast('¡Tu personaje quedó guardado!');
    }
    else if (action === 'like') {
      const post = state.posts.find((item) => item.id === button.dataset.id);
      if (post) { state.likes = state.likes.includes(post.id) ? state.likes.filter((id) => id !== post.id) : [...state.likes, post.id]; save(); render(); }
    } else if (action === 'comments') commentsModal(button.dataset.id);
    else if (action === 'new-post') newPostModal();
    else if (action === 'edit-profile') editProfileModal();
    else if (action === 'settings') settingsModal();
    else if (action === 'reset') resetDemo();
    else if (action === 'close-modal') {
      if (event.target === button || button.closest('.modal-card')) closeModal();
    } else if (action === 'confirm-redeem') finishRedeem(button.dataset.id);
    else if (action === 'confirm-delete') finishDelete(button.dataset.id);
    else if (action === 'confirm-reset') {
      const previousState = state;
      state = initialState();
      if (!save()) state = previousState;
      closeModal();
      route = state.onboardingComplete ? 'home' : 'splash';
      historyStack = [];
      render();
    } else if (action === 'redeem') redeemProduct(button.dataset.id);
    else if (action === 'open-surprise') openSurprise();
    else if (action === 'store-scroll') $('#store-products')?.scrollIntoView({ behavior: 'smooth' });
  });
  document.addEventListener('change', (event) => {
    if (event.target.name === 'frequency') {
      const form = event.target.closest('form');
      const weekdays = $('.weekday-choices', form);
      if (weekdays) weekdays.hidden = event.target.value !== 'Días específicos';
      form.querySelectorAll('.segmented label').forEach((label) => label.classList.toggle('selected', label.contains(event.target)));
    }
    if (event.target.matches('[data-action="sound-toggle"]')) {
      state.sound = event.target.checked; state.effects = event.target.checked; save(); toast(state.sound ? 'Sonidos activados.' : 'Sonidos desactivados.');
    }
    if (event.target.matches('[data-setting="music"]')) {
      state.music = event.target.checked; state.sound = state.effects || state.music; save(); toast(state.music ? 'Música activada. La música empieza al jugar.' : 'Música desactivada.');
    }
    if (event.target.matches('[data-setting="effects"]')) {
      state.effects = event.target.checked; state.sound = state.effects; save(); if (state.effects && window.KivoAudio) window.KivoAudio.effect('pop'); toast(state.effects ? 'Efectos activados.' : 'Efectos desactivados.');
    }
    if (event.target.matches('[data-setting="volume"]')) {
      state.volume = Number(event.target.value); save(); const label=event.target.closest('.sound-volume')?.querySelector('strong'); if(label)label.textContent=`${state.volume}%`;
    }
    const choice = event.target.closest('.category-choice, .character-choice, .segmented label');
    if (choice) {
      const group = choice.closest('.category-grid, .character-choices, .segmented');
      if (group) group.querySelectorAll('.selected').forEach((node) => node.classList.remove('selected'));
      choice.classList.add('selected');
    }
  });
  document.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button') && window.KivoAudio) window.KivoAudio.effect('click');
  });
  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (form.id === 'register-form') {
      event.preventDefault();
      const data = new FormData(form);
      const previousState = { ...state };
      state.name = String(data.get('name') || '').trim().slice(0, 24);
      state.email = String(data.get('email') || '').trim().toLowerCase().slice(0, 120);
      state.username = String(data.get('username') || '').trim().replace(/[^a-zA-Z0-9_]/g, '').slice(0, 24);
      if (!state.name || !state.email || !state.username) {
        toast('Completá los datos para crear tu perfil.');
        return;
      }
      state.onboardingComplete = true;
      if (save()) {
        route = 'home';
        routeData = {};
        historyStack = [];
        render();
        toast(`¡Qué bueno tenerte acá, ${state.name}!`);
      } else {
        state = previousState;
      }
    }
    else if (form.id === 'habit-editor') { event.preventDefault(); addHabit(form); }
    else if (form.id === 'profile-editor') {
      event.preventDefault();
      const data = new FormData(form);
      state.name = String(data.get('name') || '').trim().slice(0, 24);
      state.username = String(data.get('username') || '').trim().replace(/[^a-zA-Z0-9_]/g, '').slice(0, 24);
      save(); closeModal(); render(); toast('Tu perfil quedó actualizado.');
    } else if (form.id === 'post-form') { event.preventDefault(); updatePost(form); }
    else if (form.id === 'comment-form') { event.preventDefault(); updateComment(form); }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modalRoot.firstElementChild) closeModal();
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.gift-stage[data-action="open-surprise"]')) {
      event.preventDefault();
      openSurprise();
    }
  });

  if (window.KivoAudio) window.KivoAudio.setFromAppState(state);
  window.KivoApp = { navigate, goBack, toast };
  render();
})();

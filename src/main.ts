// =============================================
// MEX Smart Car — Interactive Website
// Figma "Mex Smart Car" faithfully replicated as live web experience
// @ts-nocheck
// =============================================

// ============== 真实音频系统（Web Audio API）- 用于 Music Detail ==============
let audioCtx: AudioContext | null = null;
let oscillator: OscillatorNode | null = null;
let gainNode: GainNode | null = null;
let filterNode: BiquadFilterNode | null = null;
let lfo: OscillatorNode | null = null;
let lfoGain: GainNode | null = null;

function initAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch (e) {
    console.warn('Web Audio API not supported');
  }
}

function startMusicAudio() {
  if (!audioCtx) initAudio();
  if (!audioCtx || oscillator) return;

  oscillator = audioCtx.createOscillator();
  gainNode = audioCtx.createGain();
  filterNode = audioCtx.createBiquadFilter();
  lfo = audioCtx.createOscillator();
  lfoGain = audioCtx.createGain();

  // Pleasant synth pad-like tone
  oscillator.type = 'sawtooth';
  oscillator.frequency.value = 78; // Low base note

  lfo.type = 'sine';
  lfo.frequency.value = 0.6; // Slow vibrato
  lfoGain.gain.value = 2.2;

  filterNode.type = 'lowpass';
  filterNode.frequency.value = 980;

  gainNode.gain.value = (state.volume / 100) * 0.18; // Master volume

  // Wiring
  lfo.connect(lfoGain);
  lfoGain.connect(oscillator.frequency);

  oscillator.connect(filterNode);
  filterNode.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start();
  lfo.start();
}

function stopMusicAudio() {
  if (oscillator) {
    try { oscillator.stop(); } catch {}
    oscillator = null;
  }
  if (lfo) {
    try { lfo.stop(); } catch {}
    lfo = null;
  }
  gainNode = null;
  filterNode = null;
  lfoGain = null;
}

function updateMusicVolume() {
  if (gainNode) {
    gainNode.gain.value = (state.volume / 100) * 0.18;
  }
}

// =============================================

interface AppState {
  fuel: number;
  range: number;
  temp: number;
  started: boolean;
  autoDrive: boolean;
  autoPacking: boolean;
  pickMe: boolean;
  autoRefuel: boolean;
  lightsOn: boolean;
  doorsLocked: boolean;
  fanLevel: number;
  currentScreen: string;
  musicPlaying: boolean;
  currentTrack: string;
  volume: number;
  carColor: string;
  wheelType: string;
  package: string;

  // Door control states (from Figma Door screen)
  frontLeftLocked: boolean;
  frontRightLocked: boolean;
  rearLeftLocked: boolean;
  rearRightLocked: boolean;
  trunkLocked: boolean;
  sunroofLocked: boolean;

  // Light control states (from Figma Light screen)
  headlightsOn: boolean;
  headlightsBrightness: number;
  decorationLightsOn: boolean;
  interiorLightsOn: boolean;
}

const state: AppState = {
  fuel: 68,
  range: 1,
  temp: 28,
  started: false,
  autoDrive: false,
  autoPacking: false,
  pickMe: false,
  autoRefuel: false,
  lightsOn: false,
  doorsLocked: true,
  fanLevel: 3,
  currentScreen: 'home',
  musicPlaying: false,
  currentTrack: 'Nocturne Op.9 No.2',
  volume: 72,
  carColor: 'obsidian',
  wheelType: 'amg19',
  package: 'standard',

  // Door states (matching Figma top-down control)
  frontLeftLocked: true,
  frontRightLocked: true,
  rearLeftLocked: true,
  rearRightLocked: true,
  trunkLocked: true,
  sunroofLocked: true,

  // Light states
  headlightsOn: true,
  headlightsBrightness: 60,
  decorationLightsOn: false,
  interiorLightsOn: false,
};

// ============== MUSIC DATA (matching music-list.png + details.png) ==============

const musicTracks = [
  { id: 't1', title: 'I love you tonight', artist: 'Enrique - Ivanscop', artColor: '#3b2a1f' },
  { id: 't2', title: 'The Great One', artist: 'Enrique - Ivanscop', artColor: '#1f2a3b' },
  { id: 't3', title: 'The fox', artist: 'Roddy Ricch', artColor: '#2a3b2f' },
  { id: 't4', title: "Don't Start Now", artist: 'Dua Lipa', artColor: '#3b2f3a' },
  { id: 't5', title: 'Life Is Good', artist: 'Future Featuring Dude', artColor: '#2f2f3b' },
  { id: 't6', title: 'Blinding Lights', artist: 'The Weeknd', artColor: '#3b1f2a' },
  { id: 't7', title: 'Roxanne', artist: 'Arizona Zervras', artColor: '#1f3b2a' },
  { id: 't8', title: 'Boney Music', artist: 'Boney M', artColor: '#2a2f3b' },
];

// ============== MAPS SCREEN DATA (functional fake map) ==============
interface MapLocation {
  id: string;
  name: string;
  address: string;
  eta: string;
  left: number; // % from left in viewport
  top: number;  // % from top
}

const mapLocations: MapLocation[] = [
  { id: 'home', name: 'Home', address: '1847 Pride Avenue, New York', eta: 'Now', left: 38, top: 58 },
  { id: 'office', name: 'Office Tower', address: '420 Madison Ave, New York', eta: '11 min', left: 72, top: 24 },
  { id: 'charge', name: 'Supercharger', address: '88 7th Ave Charging Hub', eta: '4 min', left: 19, top: 31 },
  { id: 'cafe', name: 'Downtown Cafe', address: '15 Hudson Yards', eta: '7 min', left: 64, top: 71 },
  { id: 'park', name: 'Central Park Garage', address: '5th Ave & 59th St', eta: '14 min', left: 51, top: 14 },
];

let mapSelectedId: string | null = null;
let navTimer: any = null;

// ============== APP DEMO RENDERERS ==============

function updatePhoneTime() {
  const el = document.getElementById('phone-time');
  if (!el) return;
  const now = new Date();
  el.textContent = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
}

function setActiveNav(screen: string) {
  document.querySelectorAll('.nav-item').forEach(el => {
    const isActive = el.id === `nav-${screen}`;
    el.classList.toggle('active', isActive);
    // Accessibility polish: manage aria-selected for tab role
    el.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}

function switchAppScreen(screen: string) {
  // 离开 Music Detail 时自动停止音频
  if (state.currentScreen === 'music-detail' && screen !== 'music-detail') {
    stopMusicAudio();
  }

  state.currentScreen = screen;
  setActiveNav(screen);
  const content = document.getElementById('app-content')!;
  
  switch (screen) {
    case 'home': renderHome(content); break;
    case 'control': renderControl(content); break;
    case 'utility': renderUtility(content); break;
    case 'music': renderMusic(content); break;
    case 'music-detail': renderMusicDetail(content); break;
    case 'settings': renderSettings(content); break;
    case 'door': renderDoor(content); break;
    case 'light': renderLight(content); break;
    case 'maps': renderMaps(content); break;
    default: renderHome(content);
  }
}

function renderHome(container: HTMLElement) {
  container.innerHTML = `
    <div class="px-1 pt-5">
      <div class="h-px bg-white/20 w-12 mb-4"></div>
      
      <div class="text-[27px] font-semibold tracking-[-0.6px] leading-none mb-7">
        Mercedes-Benz<br>E350
      </div>

      <!-- Hero Car Image (exact reference photo from Figma for fidelity) -->
      <div class="relative -mx-1 mb-7 rounded-2xl overflow-hidden aspect-[16/9] bg-[#111] border border-white/5">
        <img src="/references/cars/hero-e350.jpg" alt="Mercedes-Benz E350 Obsidian Black" 
             class="absolute inset-0 w-full h-full object-cover">
        <div class="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60"></div>
        <div class="absolute bottom-3 right-3 px-3 py-px bg-black/70 rounded-full text-[10px] tracking-wider">E 350</div>
        ${state.lightsOn ? `<div class="absolute top-4 right-4 px-2 py-0.5 text-[9px] bg-[#00b4ff] text-black rounded-full font-medium">LIGHTS ON</div>` : ''}
      </div>

      <!-- Start Car -->
      <button onclick="toggleStartCar()" 
              class="w-full py-3.5 mb-6 rounded-2xl font-semibold text-lg transition-all active:scale-[0.985] ${state.started ? 'bg-[#22c55e] text-black' : 'btn-primary'}">
        ${state.started ? '✓ CAR STARTED — Tap to Stop' : 'Start Car'}
      </button>

      <!-- Status -->
      <div class="text-xs font-medium tracking-widest text-white/60 mb-2 px-0.5">STATUS</div>
      <div class="status-grid">
        <div class="status-card">
          <div class="flex justify-center mb-1"><span class="text-base">⛽</span></div>
          <div class="label">Fuel</div>
          <div class="value">${state.fuel}%</div>
        </div>
        <div class="status-card">
          <div class="flex justify-center mb-1"><span class="text-base">📍</span></div>
          <div class="label">Range</div>
          <div class="value">${state.range} km</div>
        </div>
        <div class="status-card">
          <div class="flex justify-center mb-1"><span class="text-base">🌡</span></div>
          <div class="label">Temp</div>
          <div class="value">${state.temp}°C</div>
        </div>
      </div>

      <!-- Quick Control -->
      <div class="text-xs font-medium tracking-widest text-white/60 mb-3 px-0.5">QUICK CONTROL</div>
      <div class="quick-control">
        ${createQuickControlCard('autoDrive', 'Auto Drive', state.autoDrive, '◎')}
        ${createQuickControlCard('autoPacking', 'Auto Packing', state.autoPacking, 'P')}
        ${createQuickControlCard('pickMe', 'Pick me', state.pickMe, '📍')}
        ${createQuickControlCard('autoRefuel', 'Auto refuel', state.autoRefuel, '⛽')}
      </div>
    </div>
  `;

  // Attach quick control listeners
  attachQuickControlListeners(container);
}

function createQuickControlCard(key: keyof AppState, label: string, active: boolean, icon: string): string {
  return `
    <div data-key="${key}" class="qc-card ${active ? 'active' : ''}">
      <div class="icon text-xl">${icon}</div>
      <div>
        <div class="title">${label}</div>
        <div class="status">${active ? 'On' : 'Off'}</div>
      </div>
    </div>
  `;
}

function attachQuickControlListeners(container: HTMLElement) {
  container.querySelectorAll('.qc-card').forEach(card => {
    card.addEventListener('click', () => {
      const key = card.getAttribute('data-key') as keyof AppState;
      if (!key) return;
      
      (state as any)[key] = !(state as any)[key];
      
      // Re-render current screen
      const content = document.getElementById('app-content')!;
      if (state.currentScreen === 'home') renderHome(content);
    });
  });
}

function renderControl(container: HTMLElement) {
  container.innerHTML = `
    <div class="pt-4 pb-8 px-0.5">
      <div class="text-[27px] font-semibold tracking-[-0.5px] mb-4">Control</div>

      <!-- Front car visual (high fidelity) -->
      <div class="mb-5 -mx-1 rounded-2xl overflow-hidden bg-[#0a0a0a]">
        ${createDynamicCarVisual({ mode: 'front', lightsOn: state.headlightsOn || state.lightsOn, brightness: state.headlightsBrightness || 55, doorsOpen: !state.doorsLocked })}
      </div>

      <div class="text-sm text-white/60 mb-3 px-1">1847 Pride Avenue, New York • ${state.fuel}% • Mercedes-Benz E350</div>

      <div class="mt-4">
        ${createControlRow('autoDrive', 'Auto Drive', state.autoDrive, '◎')}
        ${createControlRow('autoPacking', 'Auto Packing', state.autoPacking, 'P')}
        ${createControlRow('pickMe', 'Pick me', state.pickMe, '📍')}
        ${createControlRow('autoRefuel', 'Auto refueling', state.autoRefuel, '⛽')}
        
        <!-- Lights & Doors (linked to dedicated high-fid screens) -->
        <div onclick="switchAppScreen('light')" class="control-row">
          <div class="icon">💡</div>
          <div class="label">Headlights &amp; Ambient</div>
          <div class="text-xs px-3 py-0.5 rounded-full ${state.lightsOn ? 'bg-[#00b4ff] text-black' : 'bg-white/10'}">${state.lightsOn ? 'ON' : 'OFF'}</div>
          <div class="chevron ml-1">›</div>
        </div>
        
        <div onclick="switchAppScreen('door')" class="control-row">
          <div class="icon">🚪</div>
          <div class="label">Doors</div>
          <div class="text-xs px-3 py-0.5 rounded-full ${state.doorsLocked ? 'bg-white/10' : 'bg-[#ef4444]/70'}">${state.doorsLocked ? 'LOCKED' : 'UNLOCKED'}</div>
          <div class="chevron ml-1">›</div>
        </div>

        <!-- Climate slider -->
        <div class="py-4">
          <div class="flex justify-between text-xs mb-2 px-1">
            <div class="text-white/70">Climate Control</div>
            <div class="font-medium">${state.temp}°C</div>
          </div>
          <input type="range" min="16" max="30" step="1" value="${state.temp}" 
                 class="w-full accent-[#00b4ff]" oninput="updateClimate(this.value)">
          <div class="flex justify-between text-[10px] text-white/40 mt-1 px-0.5">
            <div>16°C</div><div>30°C</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function createControlRow(key: string, label: string, active: boolean, icon: string): string {
  return `
    <div onclick="toggleFeature('${key}')" class="control-row">
      <div class="icon">${icon}</div>
      <div class="label">${label}</div>
      <div class="text-xs px-3 py-px rounded ${active ? 'bg-[#00b4ff] text-black font-medium' : 'bg-white/10'}">${active ? 'ACTIVE' : 'OFF'}</div>
      <div class="chevron ml-1">›</div>
    </div>
  `;
}

function toggleFeature(key: string) {
  (state as any)[key] = !(state as any)[key];
  const content = document.getElementById('app-content')!;
  renderControl(content);
}

function toggleLights() {
  state.lightsOn = !state.lightsOn;
  const content = document.getElementById('app-content')!;
  renderControl(content);
}

function toggleDoors() {
  state.doorsLocked = !state.doorsLocked;
  const content = document.getElementById('app-content')!;
  renderControl(content);
}

function updateClimate(val: string) {
  state.temp = parseInt(val);
  // Live update Home if it were visible, but for now just state
  // If user goes back to home it will reflect
}

function renderUtility(container: HTMLElement) {
  container.innerHTML = `
    <div class="pt-2 bg-black h-full overflow-auto">
      <div class="px-4">
        <div class="text-[26px] font-semibold tracking-[-0.4px] mb-3">Utility</div>

        <!-- Car photo header + location/fuel line (matching Figma Utility) -->
        <div class="mb-4">
          ${createDynamicCarVisual({ mode: 'front', lightsOn: state.headlightsOn || state.lightsOn, brightness: state.headlightsBrightness || 55 })}
          <div class="mt-1.5 px-1 text-[11px] flex items-center gap-2 text-white/80">
            <span>📍</span> 1847 Pride Avenue, New York &nbsp;•&nbsp; ${state.fuel}%
          </div>
        </div>

        <!-- 4-action row - now fully functional -->
        <div class="grid grid-cols-4 gap-2 mb-5">
          <!-- Lock All -->
          <div onclick="quickLockAll()" class="bg-[#111] rounded-2xl py-3 flex flex-col items-center text-center text-xs active:bg-[#1a1a1a] cursor-pointer">
            <div class="text-xl mb-1">🔒</div>
            <div>Lock</div>
            <div class="text-[10px] text-white/40 mt-0.5">${state.doorsLocked ? 'All Locked' : 'Unlocked'}</div>
          </div>

          <!-- Trunk -->
          <div onclick="toggleTrunkQuick()" class="bg-[#111] rounded-2xl py-3 flex flex-col items-center text-center text-xs active:bg-[#1a1a1a] cursor-pointer">
            <div class="text-xl mb-1">🚪</div>
            <div>Trunk</div>
            <div class="text-[10px] text-white/40 mt-0.5">${state.trunkLocked ? 'Closed' : 'Open'}</div>
          </div>

          <!-- Horn -->
          <div onclick="playHorn()" class="bg-[#111] rounded-2xl py-3 flex flex-col items-center text-center text-xs active:bg-[#1a1a1a] cursor-pointer">
            <div class="text-xl mb-1">📢</div>
            <div>Horn</div>
            <div class="text-[10px] text-white/40 mt-0.5">Honk</div>
          </div>

          <!-- Head Light -->
          <div onclick="quickToggleHeadlights()" class="bg-[#111] rounded-2xl py-3 flex flex-col items-center text-center text-xs active:bg-[#1a1a1a] cursor-pointer">
            <div class="text-xl mb-1">💡</div>
            <div>Head Light</div>
            <div class="text-[10px] text-white/40 mt-0.5">${state.headlightsOn ? 'On' : 'Off'}</div>
          </div>
        </div>
      </div>

      <!-- Vertical menu list (Climate, Light, Door, Music, Radio) -->
      <div class="border-t border-white/10 mx-4 pt-1">
        <div onclick="alert('Climate control coming in full version')" class="flex items-center gap-3 py-3.5 border-b border-white/10 text-sm">
          <div class="w-5">🌬</div>
          <div class="flex-1">Climate</div>
          <div class="text-white/40">›</div>
        </div>
        <div onclick="switchAppScreen('light')" class="flex items-center gap-3 py-3.5 border-b border-white/10 text-sm cursor-pointer">
          <div class="w-5">💡</div>
          <div class="flex-1">Light</div>
          <div class="text-white/40">›</div>
        </div>
        <div onclick="switchAppScreen('door')" class="flex items-center gap-3 py-3.5 border-b border-white/10 text-sm cursor-pointer">
          <div class="w-5">🚪</div>
          <div class="flex-1">Door</div>
          <div class="text-white/40">›</div>
        </div>
        <div onclick="switchAppScreen('music')" class="flex items-center gap-3 py-3.5 border-b border-white/10 text-sm cursor-pointer">
          <div class="w-5">🎵</div>
          <div class="flex-1">Music</div>
          <div class="text-white/40">›</div>
        </div>
        <div onclick="switchAppScreen('maps')" class="flex items-center gap-3 py-3.5 border-b border-white/10 text-sm cursor-pointer">
          <div class="w-5">🗺️</div>
          <div class="flex-1">Maps</div>
          <div class="text-white/40">›</div>
        </div>
        <div onclick="alert('Radio feature coming soon')" class="flex items-center gap-3 py-3.5 text-sm">
          <div class="w-5">📻</div>
          <div class="flex-1">Radio</div>
          <div class="text-white/40">›</div>
        </div>
      </div>

      <div class="text-center text-[10px] text-white/40 mt-6 mb-3">All vehicle data synced • Last update just now</div>
    </div>
  `;
}

function renderMusic(container: HTMLElement) {
  // Music LIST view — high fidelity match to music-list.png
  const q = (document.getElementById('music-search-input') as HTMLInputElement)?.value?.toLowerCase() || '';
  const filtered = musicTracks.filter(t => 
    t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
  );

  let html = `
    <div class="pt-2 px-4 bg-black h-full overflow-auto">
      <div class="flex items-center gap-3 mb-3">
        <div class="text-[26px] font-semibold tracking-[-0.4px]">Music List</div>
      </div>

      <!-- Search bar -->
      <input id="music-search-input" type="text" placeholder="Search" 
             class="music-search" oninput="filterMusicList()" value="${q}">

      <div class="text-[11px] font-medium tracking-[1px] text-white/50 mb-1.5 px-1">SONGS • ${filtered.length}</div>
      <div id="music-track-list" class="pb-4">
  `;

  filtered.forEach(track => {
    const isCurrent = state.currentTrack === track.title;
    html += `
      <div class="music-track" onclick="selectMusicTrack('${track.id}')">
        <div class="music-album-art" style="background-color: ${track.artColor}; background-image: linear-gradient(135deg, ${track.artColor}, #111);"></div>
        <div class="music-track-info">
          <div class="music-track-title ${isCurrent ? 'text-[#00b4ff]' : ''}">${track.title}</div>
          <div class="music-track-artist">${track.artist}</div>
        </div>
        ${isCurrent && state.musicPlaying ? '<div class="text-[10px] text-[#00b4ff] pr-1">▶</div>' : ''}
      </div>
    `;
  });

  if (!filtered.length) {
    html += `<div class="py-8 text-center text-white/40 text-sm">No matches</div>`;
  }

  html += `</div>
      <!-- Mini now playing bar (tap for details) -->
      <div onclick="switchAppScreen('music-detail')" class="mt-4 mb-2 bg-[#1a1a1a] rounded-2xl px-4 py-3 flex items-center gap-3 cursor-pointer active:bg-[#222]">
        <div class="w-9 h-9 rounded-lg flex-shrink-0" style="background: linear-gradient(#222,#111);"></div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium truncate">${state.currentTrack}</div>
          <div class="text-[11px] text-white/50">Now playing • E350</div>
        </div>
        <button onclick="event.stopImmediatePropagation(); toggleMusicPlay(); return false;" class="w-8 h-8 flex items-center justify-center text-lg border border-white/20 rounded-full">
          ${state.musicPlaying ? '⏸' : '▶'}
        </button>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function filterMusicList() {
  const content = document.getElementById('app-content')!;
  renderMusic(content); // re-render list with filter
}

function selectMusicTrack(trackId: string) {
  const track = musicTracks.find(t => t.id === trackId);
  if (!track) return;
  state.currentTrack = track.title;
  state.selectedTrackForDetail = track.title;
  state.musicPlaying = true;
  state.musicProgress = 12;
  // Open detail view
  const content = document.getElementById('app-content')!;
  renderMusicDetail(content);
}

function toggleMusic() {
  state.musicPlaying = !state.musicPlaying;
  const content = document.getElementById('app-content')!;
  renderMusic(content);
}

function renderSettings(container: HTMLElement) {
  // High fidelity to settings.png reference: black car photo, exact vehicle info BELOW image,
  // thin top separator, precise outline-style icons, exact menu order + blue toggle + bordered Sign Out
  container.innerHTML = `
    <div class="pt-1 px-4 bg-black h-full overflow-auto">
      <div class="h-px bg-white/25 w-8 mb-1"></div>
      <div class="text-[26px] font-semibold tracking-[-0.4px] mb-3">Settings</div>
      
      <!-- Exact black Mercedes side photo from hero (matches ref car) -->
      <div class="mb-2.5 rounded-2xl overflow-hidden border border-white/10">
        <img src="/references/cars/hero-e350.jpg" class="w-full h-[120px] object-cover" alt="2020 Mercedes-Benz E350 black">
      </div>

      <!-- Vehicle info line EXACT from Figma reference (placed below photo, not overlaid) -->
      <div class="px-1 mb-4 text-[12.5px] text-white/80 space-y-px">
        <div class="flex items-center gap-1.5"><span>📅</span> 2020 | Mescedes Benz E350</div>
        <div class="flex items-center gap-1.5"><span>📋</span> License Plates | 8RYS 8999 NY</div>
      </div>

      <div class="space-y-px text-[15px]">
        <div onclick="renderProfileInSettings(this)" class="flex items-center justify-between py-[13px] border-b border-white/10 cursor-pointer active:bg-white/5 px-1">
          <div class="flex items-center gap-3"><span class="opacity-70">👤</span> <span>Profile</span></div><span class="text-white/40">›</span>
        </div>
        <div class="flex items-center justify-between py-[13px] border-b border-white/10 px-1">
          <div class="flex items-center gap-3"><span class="opacity-70">🚗</span> <span>Car Information</span></div><span class="text-white/40">›</span>
        </div>
        <div class="flex items-center justify-between py-[13px] border-b border-white/10 px-1">
          <div class="flex items-center gap-3"><span class="opacity-70">📄</span> <span>Change Your Car</span></div><span class="text-white/40">›</span>
        </div>
        <div class="flex items-center justify-between py-[13px] border-b border-white/10 px-1">
          <div class="flex items-center gap-3"><span class="opacity-70">🔔</span> <span>Notification</span></div>
          <label class="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked class="sr-only peer"><div class="w-8 h-[17px] bg-[#00b4ff] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-[13px] after:w-[13px] after:transition-all"></div></label>
        </div>
        <div class="flex items-center justify-between py-[13px] border-b border-white/10 px-1">
          <div class="flex items-center gap-3"><span class="opacity-70">💳</span> <span>Payment</span></div><span class="text-white/40">›</span>
        </div>
        <div class="flex items-center justify-between py-[13px] px-1">
          <div class="flex items-center gap-3"><span class="opacity-70">🎧</span> <span>Customer Service</span></div><span class="text-white/40">›</span>
        </div>
      </div>

      <button onclick="logoutDemo()" 
              class="mt-7 w-full py-3 text-sm border border-white/20 rounded-2xl active:bg-white/5">
        Sign Out
      </button>
    </div>
  `;
}

function renderProfileInSettings(el: HTMLElement) {
  const container = document.getElementById('app-content')!;
  // High fidelity to profile.png reference: large title + back arrow, realistic photo-like avatar (CSS layered for exact match without external assets),
  // exact 6 field rows with precise labels, full address text, Password row, chevrons only on editable rows, matching spacing/dividers
  container.innerHTML = `
    <div class="pt-1 px-4 bg-black h-full overflow-auto text-sm">
      <!-- Header matching ref: back arrow + Profile title -->
      <div class="flex items-center gap-2 mb-4">
        <button onclick="switchAppScreen('settings')" class="text-[28px] leading-none text-white/70 active:text-white pr-1">‹</button>
        <div class="text-[26px] font-semibold tracking-[-0.5px]">Profile</div>
      </div>

      <!-- Avatar + name: detailed CSS portrait mimicking the exact photo in reference (brown hair, glasses, beard, smile) -->
      <div class="text-center mb-5">
        <div style="width:92px;height:92px;border-radius:9999px;overflow:hidden;border:3px solid #1f2937;margin:0 auto 10px;position:relative;background:#c9b8a8;box-shadow:inset 0 2px 4px rgba(0,0,0,0.2)">
          <!-- Hair -->
          <div style="position:absolute;top:-1px;left:3px;right:3px;height:38px;background:#3f2a1f;border-radius:9999px 9999px 38% 38%;"></div>
          <!-- Face base -->
          <div style="position:absolute;top:24px;left:13px;right:13px;bottom:10px;background:#e8d9c8;border-radius:50%;"></div>
          <!-- Left eye + glasses frame -->
          <div style="position:absolute;top:40px;left:21px;width:17px;height:11px;border:1.75px solid #1f2937;border-radius:2px;background:#fff;"></div>
          <!-- Right eye + glasses frame -->
          <div style="position:absolute;top:40px;right:21px;width:17px;height:11px;border:1.75px solid #1f2937;border-radius:2px;background:#fff;"></div>
          <!-- Glasses bridge -->
          <div style="position:absolute;top:44px;left:50%;transform:translateX(-50%);width:9px;height:2px;background:#1f2937;"></div>
          <!-- Eyebrows -->
          <div style="position:absolute;top:35px;left:21px;width:15px;height:2px;background:#3f2a1f;border-radius:2px;"></div>
          <div style="position:absolute;top:35px;right:21px;width:15px;height:2px;background:#3f2a1f;border-radius:2px;"></div>
          <!-- Smile -->
          <div style="position:absolute;bottom:19px;left:50%;transform:translateX(-50%);width:16px;height:7px;border-bottom:1.5px solid #8b6648;border-radius:50%;"></div>
          <!-- Subtle beard / jaw shadow -->
          <div style="position:absolute;bottom:6px;left:15px;right:15px;height:26px;background:linear-gradient(transparent, rgba(70,55,40,0.22));border-radius:50%;"></div>
          <!-- Light cheek highlight -->
          <div style="position:absolute;top:48px;left:18px;width:8px;height:10px;background:rgba(255,255,255,0.25);border-radius:50%;"></div>
        </div>
        <div class="text-[21px] font-semibold tracking-[-0.3px]">John Smith</div>
      </div>

      <!-- Exact fields from reference with correct labels, dividers, alignment and chevrons -->
      <div class="space-y-[1px] bg-[#111] rounded-2xl overflow-hidden border border-white/10 text-[14.5px]">
        <div class="flex justify-between items-center px-4 py-[13px] border-b border-white/10">
          <div class="text-white/55">Your name</div>
          <div>John Smith</div>
        </div>
        <div class="flex justify-between items-center px-4 py-[13px] border-b border-white/10">
          <div class="text-white/55">Email</div>
          <div class="text-[#00b4ff]">johnsmith@gmail.com ›</div>
        </div>
        <div class="flex justify-between items-center px-4 py-[13px] border-b border-white/10">
          <div class="text-white/55">Address</div>
          <div>1847 Pride Avenue, New York ›</div>
        </div>
        <div class="flex justify-between items-center px-4 py-[13px] border-b border-white/10">
          <div class="text-white/55">Phone number</div>
          <div>+1 287 778-2899 ›</div>
        </div>
        <div class="flex justify-between items-center px-4 py-[13px] border-b border-white/10">
          <div class="text-white/55">License driving number</div>
          <div>6274 2882 6112 ›</div>
        </div>
        <div class="flex justify-between items-center px-4 py-[13px]">
          <div class="text-white/55">Password</div>
          <div>••••••• ›</div>
        </div>
      </div>

      <div class="h-6"></div>
    </div>
  `;
}

function saveProfileAndReturn() {
  const content = document.getElementById('app-content')!;
  switchAppScreen('settings');
}

// ============== GLOBAL ACTIONS ==============

function toggleStartCar() {
  state.started = !state.started;
  
  if (state.started) {
    state.range = Math.max(380, state.range);
    state.fuel = Math.max(61, state.fuel - 1);
  }
  
  const content = document.getElementById('app-content')!;
  if (state.currentScreen === 'home') {
    renderHome(content);
  } else {
    // If on other screen, flash feedback
    const orig = document.getElementById('phone-frame')!.style.boxShadow;
    document.getElementById('phone-frame')!.style.boxShadow = state.started ? 
      '0 0 0 12px #111, 0 0 0 16px #1a1a1a, 0 0 60px -5px rgb(16 185 129 / 0.5)' : orig;
    setTimeout(() => {
      document.getElementById('phone-frame')!.style.boxShadow = orig || '';
    }, 1100);
  }
}

function updateClimateLive(val: string) {
  state.temp = parseInt(val);
}

function logoutDemo() {
  if (confirm('Log out of Mex? (demo)')) {
    alert('Logged out. In real app this would return to login screen.');
    switchAppScreen('home');
  }
}

// ============== CONFIGURATOR ==============

const colors: Record<string, { name: string; hex: string; price: number }> = {
  obsidian: { name: 'Obsidian Black', hex: '#0f0f0f', price: 0 },
  silver: { name: 'Iridium Silver', hex: '#c5c7c9', price: 6800 },
  blue: { name: 'Nautic Blue', hex: '#1e3a5f', price: 9200 },
  white: { name: 'Polar White', hex: '#e5e5e5', price: 5400 },
};

const wheels: Record<string, { name: string; price: number }> = {
  amg19: { name: '19" AMG 5-Spoke', price: 0 },
  amg20: { name: '20" AMG Multi-Spoke', price: 18500 },
  aero: { name: '19" Aero 2-Tone', price: 12400 },
};

function initConfigurator() {
  // Color swatches
  const swatchContainer = document.getElementById('color-swatches')!;
  swatchContainer.innerHTML = '';
  
  Object.entries(colors).forEach(([key, c]) => {
    const div = document.createElement('div');
    div.className = `config-swatch ${state.carColor === key ? 'active' : ''}`;
    div.style.backgroundColor = c.hex;
    div.title = c.name;
    div.onclick = () => {
      state.carColor = key;
      updateConfigurator();
    };
    swatchContainer.appendChild(div);
  });

  // Wheel options
  const wheelContainer = document.getElementById('wheel-options')!;
  wheelContainer.innerHTML = '';
  Object.entries(wheels).forEach(([key, w]) => {
    const btn = document.createElement('button');
    btn.className = `text-xs px-4 py-1.5 rounded-2xl border ${state.wheelType === key ? 'border-[#00b4ff] bg-[#00b4ff]/10' : 'border-white/15'}`;
    btn.textContent = w.name;
    btn.onclick = () => {
      state.wheelType = key;
      updateConfigurator();
    };
    wheelContainer.appendChild(btn);
  });

  // package select default
  const pkg = document.getElementById('package-select') as HTMLSelectElement;
  if (pkg) pkg.value = state.package;

  updateConfigurator();
}

function updateConfigurator() {
  const preview = document.getElementById('config-preview')!;
  const priceEl = document.getElementById('config-price')!;

  const color = colors[state.carColor];
  const wheel = wheels[state.wheelType];
  const pkgSelect = (document.getElementById('package-select') as HTMLSelectElement)?.value || state.package;
  state.package = pkgSelect;

  let pkgPrice = 0;
  if (pkgSelect === 'premium') pkgPrice = 42000;
  if (pkgSelect === 'amg') pkgPrice = 78000;

  const total = 586000 + color.price + wheel.price + pkgPrice;

  // Update preview visual with real car imagery where possible
  const imgSrc = state.carColor === 'silver' ? '/references/cars/silver-e350.jpg' : '/references/cars/hero-e350.jpg';
  preview.innerHTML = `
    <div class="w-full h-full rounded-2xl overflow-hidden border border-white/10 relative">
      <img src="${imgSrc}" alt="${color.name}" class="absolute inset-0 w-full h-full object-cover">
      <div class="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/70"></div>
      <div class="absolute bottom-4 left-4 text-left">
        <div class="text-sm font-medium tracking-wider">${color.name}</div>
        <div class="text-xs text-white/60">${wheel.name}</div>
      </div>
    </div>
  `;

  priceEl.textContent = '¥ ' + total.toLocaleString('en-US');
}

function randomizeConfig() {
  const colorKeys = Object.keys(colors);
  const wheelKeys = Object.keys(wheels);
  const pkgs = ['standard', 'premium', 'amg'];

  state.carColor = colorKeys[Math.floor(Math.random() * colorKeys.length)];
  state.wheelType = wheelKeys[Math.floor(Math.random() * wheelKeys.length)];
  state.package = pkgs[Math.floor(Math.random() * pkgs.length)];

  initConfigurator(); // re-init UI
}

// ============== MODALS & MISC ==============

function showBookModal() {
  document.getElementById('book-modal')!.classList.remove('hidden');
  document.getElementById('book-modal')!.classList.add('flex');
}

function hideBookModal() {
  const m = document.getElementById('book-modal')!;
  m.classList.add('hidden');
  m.classList.remove('flex');
}

function submitDemoForm(e: Event) {
  e.preventDefault();
  const modal = document.getElementById('book-modal')!;
  modal.innerHTML = `
    <div class="bg-[#111] max-w-md w-full rounded-3xl p-10 text-center border border-white/10">
      <div class="mx-auto w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center text-3xl mb-5">✓</div>
      <h3 class="text-2xl font-semibold">Request received</h3>
      <p class="mt-2 text-white/70 text-sm">A Mex concierge will contact you within 2 hours to schedule your personalized E350 + App demo.</p>
      <button onclick="hideBookModal();window.location.reload()" class="mt-8 text-sm underline">Return to site</button>
    </div>
  `;
  setTimeout(() => {
    // auto close after success in demo
  }, 4200);
}

// ============== NEW: Bridge between Marketing Scroller and Live Demo ==============
function showScreenInDemo(screen: string) {
  // Scroll to the live phone demo
  document.getElementById('app-demo')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  // Small delay so scroll finishes, then switch screen
  setTimeout(() => {
    if (typeof switchAppScreen === 'function') {
      switchAppScreen(screen);
    }
  }, 650);
}

function toggleMobileNav() {
  const nav = document.querySelector('nav');
  if (!nav) return;
  const existing = document.getElementById('mobile-drawer');
  if (existing) existing.remove();

  const drawer = document.createElement('div');
  drawer.id = 'mobile-drawer';
  drawer.className = 'fixed inset-0 z-[90] bg-black/95 md:hidden';
  drawer.innerHTML = `
    <div class="p-6 pt-20 text-lg space-y-2">
      <a href="#the-car" class="block py-3 active:bg-white/5 px-1 rounded">The Car</a>
      <a href="#app-demo" class="block py-3 active:bg-white/5 px-1 rounded">Live Demo</a>
      <a href="#app-experience" class="block py-3 active:bg-white/5 px-1 rounded">App Experience</a>
      <a href="#features" class="block py-3 active:bg-white/5 px-1 rounded">Features</a>
      <a href="#specs" class="block py-3 active:bg-white/5 px-1 rounded">Smart Specs</a>
      <a href="#configurator" class="block py-3 active:bg-white/5 px-1 rounded">Configurator</a>
      <div class="pt-5 border-t border-white/10 mt-2 space-y-2">
        <button onclick="document.getElementById('app-demo').scrollIntoView({behavior:'smooth'});document.getElementById('mobile-drawer').remove()" class="block w-full text-left py-3 text-base">Launch Live Demo</button>
        <button onclick="showBookModal();document.getElementById('mobile-drawer').remove()" class="mt-1 block w-full text-left py-3 text-base text-[#00b4ff]">Book a Demo Drive</button>
      </div>
    </div>
  `;
  nav.appendChild(drawer);
  drawer.onclick = (e) => { if (e.target === drawer) drawer.remove(); };
}

// ============== NEW HIGH-FIDELITY SCREENS (Door + Light from Figma) ==============

function renderDoor(container: HTMLElement) {
  const fl = state.frontLeftLocked;
  const fr = state.frontRightLocked;
  const rl = state.rearLeftLocked;
  const rr = state.rearRightLocked;
  const trunk = state.trunkLocked;
  const sunroof = state.sunroofLocked;

  container.innerHTML = `
    <div class="pt-2 px-4 bg-black h-full overflow-auto" style="background: #000;">
      <div class="flex items-center gap-3 mb-3">
        <button onclick="switchAppScreen('utility')" class="text-2xl text-white/70 hover:text-white leading-none">←</button>
        <div class="text-[26px] font-semibold tracking-[-0.4px]">Door</div>
      </div>

      <!-- Exact match to Figma Door screen: grid + top-down line art car + positioned controls -->
      <div class="relative mx-auto w-[280px] h-[440px] rounded-[48px] overflow-hidden border border-white/10"
           style="background: #0a0a0a; background-image: linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px); background-size: 24px 24px;">
        
        <!-- Large centered white line-art top-down sedan -->
        <svg width="280" height="440" viewBox="0 0 280 440" class="absolute inset-0" style="color:#e5e5e5; opacity:0.9">
          <rect x="52" y="68" width="176" height="304" rx="42" fill="none" stroke="currentColor" stroke-width="2.5"/>
          <rect x="68" y="92" width="144" height="58" rx="10" fill="none" stroke="currentColor" stroke-width="1.75" opacity="0.55"/>
          <rect x="68" y="278" width="144" height="52" rx="10" fill="none" stroke="currentColor" stroke-width="1.75" opacity="0.55"/>
          <!-- Side mirrors -->
          <rect x="36" y="158" width="20" height="32" rx="5" fill="none" stroke="currentColor" stroke-width="1.75"/>
          <rect x="224" y="158" width="20" height="32" rx="5" fill="none" stroke="currentColor" stroke-width="1.75"/>
        </svg>

        <!-- Precisely positioned controls with labels (matching Figma layout) -->
        <!-- Front Left -->
        <button onclick="toggleDoor('frontLeftLocked')" 
                class="absolute left-[18px] top-[108px] w-11 h-11 rounded-full flex items-center justify-center text-xl border transition-all active:scale-95 ${fl ? 'bg-[#2a2a2a] text-white/80 border-white/30' : 'bg-[#00b4ff] text-black border-[#00b4ff]'}">
          ${fl ? '🔒' : '🔓'}
        </button>
        <div class="absolute left-[14px] top-[155px] text-[9px] text-white/55 w-14 text-center leading-tight">Front<br>Left</div>

        <!-- Front Right (shown active blue in reference) -->
        <button onclick="toggleDoor('frontRightLocked')" 
                class="absolute right-[18px] top-[108px] w-11 h-11 rounded-full flex items-center justify-center text-xl transition-all active:scale-95 ${fr ? 'bg-[#2a2a2a] text-white/80 border-white/30' : 'bg-[#00b4ff] text-black border-[#00b4ff]'}">
          ${fr ? '🔒' : '🔓'}
        </button>
        <div class="absolute right-[12px] top-[155px] text-[9px] text-white/55 w-16 text-center leading-tight">Front<br>Right</div>

        <!-- Sunroof (center square in reference, active) -->
        <button onclick="toggleDoor('sunroofLocked')" 
                class="absolute left-1/2 top-[168px] -translate-x-1/2 w-12 h-12 rounded-2xl flex items-center justify-center text-xl border transition-all active:scale-95 ${sunroof ? 'bg-[#2a2a2a] text-white/80 border-white/30' : 'bg-[#00b4ff] text-black border-[#00b4ff]'}">
          ${sunroof ? '🔒' : '🔓'}
        </button>
        <div class="absolute left-1/2 top-[214px] -translate-x-1/2 text-[9px] text-white/55">Sunroof</div>

        <!-- Rear Left -->
        <button onclick="toggleDoor('rearLeftLocked')" 
                class="absolute left-[18px] top-[258px] w-11 h-11 rounded-full flex items-center justify-center text-xl transition-all active:scale-95 ${rl ? 'bg-[#2a2a2a] text-white/80 border-white/30' : 'bg-[#00b4ff] text-black border-[#00b4ff]'}">
          ${rl ? '🔒' : '🔓'}
        </button>
        <div class="absolute left-[14px] top-[305px] text-[9px] text-white/55 w-14 text-center leading-tight">Rear<br>Left</div>

        <!-- Rear Right -->
        <button onclick="toggleDoor('rearRightLocked')" 
                class="absolute right-[18px] top-[258px] w-11 h-11 rounded-full flex items-center justify-center text-xl transition-all active:scale-95 ${rr ? 'bg-[#2a2a2a] text-white/80 border-white/30' : 'bg-[#00b4ff] text-black border-[#00b4ff]'}">
          ${rr ? '🔒' : '🔓'}
        </button>
        <div class="absolute right-[12px] top-[305px] text-[9px] text-white/55 w-16 text-center leading-tight">Rear<br>Right</div>

        <!-- Trunk -->
        <button onclick="toggleDoor('trunkLocked')" 
                class="absolute left-1/2 bottom-[52px] -translate-x-1/2 w-11 h-11 rounded-full flex items-center justify-center text-xl transition-all active:scale-95 ${trunk ? 'bg-[#2a2a2a] text-white/80 border-white/30' : 'bg-[#00b4ff] text-black border-[#00b4ff]'}">
          ${trunk ? '🔒' : '🔓'}
        </button>
        <div class="absolute left-1/2 bottom-[30px] -translate-x-1/2 text-[9px] text-white/55">Trunk</div>
      </div>

      <div class="text-center text-[10px] text-white/40 mt-2 tracking-wide">Tap to lock / unlock individual zones</div>
    </div>
  `;
}

function toggleDoor(key: keyof AppState) {
  (state as any)[key] = !(state as any)[key];
  // Compute overall lock state
  state.doorsLocked = state.frontLeftLocked && state.frontRightLocked && 
    state.rearLeftLocked && state.rearRightLocked && state.trunkLocked && state.sunroofLocked;
  const content = document.getElementById('app-content')!;
  renderDoor(content);
}

function renderLight(container: HTMLElement) {
  const headlights = state.headlightsOn;
  const brightness = state.headlightsBrightness;
  const deco = state.decorationLightsOn;
  const interior = state.interiorLightsOn;

  container.innerHTML = `
    <div class="pt-2 px-4 bg-black h-full overflow-auto">
      <div class="flex items-center gap-3 mb-3">
        <button onclick="switchAppScreen('utility')" class="text-2xl text-white/70 hover:text-white leading-none">←</button>
        <div class="text-[26px] font-semibold tracking-[-0.4px]">Light</div>
      </div>

      <!-- Prominent front-view car with glowing headlights using real photo + refined CSS overlays 
           (high-fidelity match to Figma light.png reference; now uses createDynamicCarVisual for realistic Mercedes) -->
      <div class="relative mx-auto mb-4 w-[260px] h-[158px] bg-[#111] rounded-3xl overflow-hidden border border-white/10 flex items-center justify-center">
        ${createDynamicCarVisual({ mode: 'front', lightsOn: headlights, brightness: brightness || 60 })}
      </div>

      <div class="space-y-4 px-1 text-sm">
        <!-- Headlights + Brightness -->
        <div>
          <div class="flex justify-between items-center mb-1.5">
            <div>Headlights</div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" ${headlights ? 'checked' : ''} onchange="toggleLight('headlightsOn', this.checked)" class="sr-only peer">
              <div class="w-9 h-5 bg-white/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00b4ff]"></div>
            </label>
          </div>
          <div class="flex items-center gap-3 text-xs">
            <input type="range" min="0" max="100" step="5" value="${brightness}" 
                   class="flex-1 accent-[#00b4ff]" oninput="updateHeadlightBrightness(this.value)">
            <div class="w-8 text-right tabular-nums text-white/70">${brightness}</div>
          </div>
          <div class="flex justify-between text-[10px] text-white/40 mt-0.5"><div>0</div><div>100</div></div>
        </div>

        <div class="pt-2 border-t border-white/10 space-y-3">
          <div class="flex justify-between items-center">
            <div>Decoration Lights</div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" ${deco ? 'checked' : ''} onchange="toggleLight('decorationLightsOn', this.checked)" class="sr-only peer">
              <div class="w-9 h-5 bg-white/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00b4ff]"></div>
            </label>
          </div>
          <div class="flex justify-between items-center">
            <div>Interior Lights</div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" ${interior ? 'checked' : ''} onchange="toggleLight('interiorLightsOn', this.checked)" class="sr-only peer">
              <div class="w-9 h-5 bg-white/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00b4ff]"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  `;
}

function toggleLight(key: keyof AppState, value: boolean) {
  (state as any)[key] = value;
  // Sync global lights state for dynamic visuals across Home/Control/Utility
  state.lightsOn = state.headlightsOn || state.decorationLightsOn || state.interiorLightsOn;
  const content = document.getElementById('app-content')!;
  renderLight(content);
}

function updateHeadlightBrightness(val: string) {
  state.headlightsBrightness = parseInt(val);
  const content = document.getElementById('app-content')!;
  renderLight(content);
}

// ============== MUSIC DETAIL VIEW (high fidelity to music-details.png) ==============

function renderMusicDetail(container: HTMLElement) {
  const isPlaying = state.musicPlaying;
  const progress = state.musicProgress || 22;
  const trackTitle = state.selectedTrackForDetail || state.currentTrack;
  const trackArtist = musicTracks.find(t => t.title === trackTitle)?.artist || 'Boney M';

  container.innerHTML = `
    <div class="pt-2 px-5 bg-black h-full overflow-auto">
      <div class="flex items-center gap-3 mb-1">
        <button onclick="switchAppScreen('music')" class="text-2xl text-white/70 hover:text-white">←</button>
        <div class="text-[26px] font-semibold tracking-[-0.4px]">Music</div>
      </div>

      <!-- Large circular album art (exact treatment from Figma music-details.png) -->
      <div class="music-detail-art" style="background: linear-gradient(145deg, #222 20%, #0a0a0a 70%); background-image: radial-gradient(circle at 35% 30%, #444 0%, transparent 50%);"></div>

      <div class="text-center px-2">
        <div class="text-2xl font-semibold tracking-tight">${trackTitle}</div>
        <div class="text-white/60 mt-0.5">${trackArtist}</div>
      </div>

      <!-- Progress -->
      <div class="px-4 mt-6">
        <div class="music-progress">
          <div class="bar" style="width: ${progress}%"></div>
          <div class="thumb" style="left: ${progress}%"></div>
        </div>
        <div class="flex justify-between text-[10px] text-white/50 tabular-nums mt-1 px-0.5">
          <div>0:${Math.floor(progress * 3.2 / 10).toString().padStart(2,'0')}</div>
          <div>3:20</div>
        </div>
      </div>

      <!-- Transport controls -->
      <div class="music-controls">
        <button onclick="prevTrack()">⏮</button>
        <button onclick="toggleMusicPlay()" class="play-btn">${isPlaying ? '❚❚' : '▶'}</button>
        <button onclick="nextTrack()">⏭</button>
      </div>

      <!-- Volume control -->
      <div class="px-5 mt-5">
        <div class="flex items-center gap-3 text-xs text-white/60">
          <span>音量</span>
          <input type="range" min="0" max="100" value="${state.volume}" 
                 class="flex-1 accent-[#00b4ff]" oninput="setMusicVolume(this.value)">
          <span class="w-8 text-right tabular-nums">${state.volume}</span>
        </div>
      </div>

      <div class="mt-6 text-center">
        <div onclick="switchAppScreen('music')" class="inline-block text-xs text-white/50 active:text-white cursor-pointer">Back to list</div>
      </div>
    </div>
  `;
}

function toggleMusicPlay() {
  state.musicPlaying = !state.musicPlaying;

  if (state.musicPlaying) {
    if (state.musicProgress < 5) state.musicProgress = 14;
    startMusicAudio();
  } else {
    stopMusicAudio();
  }

  const content = document.getElementById('app-content')!;
  if (state.currentScreen === 'music-detail') {
    renderMusicDetail(content);
  } else {
    renderMusic(content);
  }
}

function playTrack(trackName: string) {
  // Legacy support from old music UI
  state.currentTrack = trackName;
  state.selectedTrackForDetail = trackName;
  state.musicPlaying = true;
  state.musicProgress = 18;
  const content = document.getElementById('app-content')!;
  renderMusicDetail(content);
}

function nextTrack() {
  const idx = musicTracks.findIndex(t => t.title === state.currentTrack);
  const next = musicTracks[(idx + 1) % musicTracks.length];
  state.currentTrack = next.title;
  state.selectedTrackForDetail = next.title;
  state.musicProgress = 8;

  stopMusicAudio();
  if (state.musicPlaying) startMusicAudio();

  const content = document.getElementById('app-content')!;
  renderMusicDetail(content);
}

function prevTrack() {
  const idx = musicTracks.findIndex(t => t.title === state.currentTrack);
  const prev = musicTracks[(idx - 1 + musicTracks.length) % musicTracks.length];
  state.currentTrack = prev.title;
  state.selectedTrackForDetail = prev.title;
  state.musicProgress = 65;

  stopMusicAudio();
  if (state.musicPlaying) startMusicAudio();

  const content = document.getElementById('app-content')!;
  renderMusicDetail(content);
}

function setMusicVolume(val: string) {
  state.volume = parseInt(val);
  updateMusicVolume();
}

// ============== Utility Quick Actions (Lock / Trunk / Horn / Head Light) ==============

function quickLockAll() {
  const newLocked = !state.doorsLocked;

  // Lock/unlock everything
  state.doorsLocked = newLocked;
  state.frontLeftLocked = newLocked;
  state.frontRightLocked = newLocked;
  state.rearLeftLocked = newLocked;
  state.rearRightLocked = newLocked;
  state.trunkLocked = newLocked;
  state.sunroofLocked = newLocked;

  // Visual feedback
  showToast(newLocked ? 'All doors locked' : 'All doors unlocked');

  // Re-render current screen
  const content = document.getElementById('app-content')!;
  if (state.currentScreen === 'utility') {
    renderUtility(content);
  } else {
    // If user is in Door screen, refresh it too
    if (state.currentScreen === 'door') renderDoor(content);
    if (state.currentScreen === 'home') renderHome(content);
    if (state.currentScreen === 'control') renderControl(content);
  }
}

function toggleTrunkQuick() {
  state.trunkLocked = !state.trunkLocked;

  // Keep overall doorsLocked in sync
  state.doorsLocked = state.frontLeftLocked && state.frontRightLocked && 
                      state.rearLeftLocked && state.rearRightLocked && 
                      state.trunkLocked && state.sunroofLocked;

  showToast(state.trunkLocked ? 'Trunk closed' : 'Trunk opened');

  const content = document.getElementById('app-content')!;
  if (state.currentScreen === 'utility') {
    renderUtility(content);
  } else if (state.currentScreen === 'door') {
    renderDoor(content);
  }
}

function quickToggleHeadlights() {
  state.headlightsOn = !state.headlightsOn;
  state.lightsOn = state.headlightsOn || state.decorationLightsOn || state.interiorLightsOn;

  showToast(state.headlightsOn ? 'Headlights turned on' : 'Headlights turned off');

  const content = document.getElementById('app-content')!;
  if (state.currentScreen === 'utility') {
    renderUtility(content);
  } else if (state.currentScreen === 'light') {
    renderLight(content);
  } else if (state.currentScreen === 'home' || state.currentScreen === 'control') {
    // Re-render screens that show the car
    if (state.currentScreen === 'home') renderHome(content);
    if (state.currentScreen === 'control') renderControl(content);
  }
}

// Simple horn sound using Web Audio API
let hornTimeout: number | null = null;

function playHorn() {
  if (!audioCtx) initAudio();
  if (!audioCtx) {
    showToast('Horn sound not supported');
    return;
  }

  // Stop previous horn if playing
  if (hornTimeout) clearTimeout(hornTimeout);

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  osc.type = 'sawtooth';
  osc.frequency.value = 120;

  filter.type = 'lowpass';
  filter.frequency.value = 800;

  gain.gain.value = 0.6;

  // Quick attack + decay envelope
  const now = audioCtx.currentTime;
  gain.gain.setValueAtTime(0.6, now);
  gain.gain.linearRampToValueAtTime(0.001, now + 0.65);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(now);
  osc.stop(now + 0.7);

  showToast('Honk! 📢');

  // Visual feedback - flash the horn button area if in utility
  if (state.currentScreen === 'utility') {
    const content = document.getElementById('app-content')!;
    setTimeout(() => renderUtility(content), 650);
  }
}

// Simple toast helper
function showToast(message: string) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed; 
    bottom: 80px; 
    left: 50%; 
    transform: translateX(-50%);
    background: rgba(0,0,0,0.85);
    color: #fff;
    padding: 8px 16px;
    border-radius: 999px;
    font-size: 13px;
    z-index: 9999;
    border: 1px solid rgba(255,255,255,0.1);
    pointer-events: none;
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'all 0.2s ease';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 200);
  }, 1600);
}

function renderMaps(container: HTMLElement) {
  const q = (document.getElementById('map-search') as HTMLInputElement)?.value?.toLowerCase() || '';
  const filtered = mapLocations.filter(loc => 
    loc.name.toLowerCase().includes(q) || loc.address.toLowerCase().includes(q)
  );

  const selected = mapSelectedId ? mapLocations.find(l => l.id === mapSelectedId) : null;

  container.innerHTML = `
    <div class="pt-2 px-4 bg-black h-full overflow-auto">
      <div class="flex items-center gap-3 mb-2">
        <button onclick="switchAppScreen('utility')" class="text-2xl text-white/70 hover:text-white leading-none" aria-label="Back to Utility">←</button>
        <div class="text-[26px] font-semibold tracking-[-0.4px]">Maps</div>
      </div>

      <!-- Current location -->
      <div class="flex items-center gap-1.5 text-[11px] text-white/60 mb-3 px-0.5">
        <span>📍</span>
        <span>1847 Pride Avenue, New York</span>
        <span class="ml-auto text-[10px] px-1.5 py-px bg-emerald-500/20 text-emerald-400 rounded">LIVE</span>
      </div>

      <!-- Search -->
      <div class="relative mb-3">
        <div class="absolute left-3.5 top-2.5 text-white/40 pointer-events-none">🔍</div>
        <input id="map-search" type="text" placeholder="Search destinations, addresses..." 
               class="map-search" oninput="filterMapLocations()" value="${q}" aria-label="Search map destinations">
      </div>

      <!-- Interactive Fake Map Viewport -->
      <div id="map-viewport" class="map-viewport relative mx-auto w-full max-w-[320px] h-[262px] rounded-3xl overflow-hidden border border-white/10 shadow-inner" role="img" aria-label="Interactive map of New York area showing current location and 5 saved destinations">
        <!-- Subtle map labels / watermarks -->
        <div class="absolute top-3 left-3 text-[9px] text-white/30 tracking-[1.5px] font-medium">NEW YORK</div>
        <div class="absolute bottom-3 right-3 text-[8px] text-white/25">MAP • DEMO</div>

        <!-- Road labels -->
        <div class="absolute text-[7px] text-white/20 font-medium" style="left:12%; top:18%">7th Ave</div>
        <div class="absolute text-[7px] text-white/20 font-medium" style="left:53%; top:46%">Madison</div>

        <!-- Location Pins -->
        ${mapLocations.map(loc => {
          const isActive = mapSelectedId === loc.id;
          const isCurrent = loc.id === 'home';
          return `
            <div class="map-pin ${isActive ? 'active' : ''}" 
                 style="left: ${loc.left}%; top: ${loc.top}%;"
                 onclick="selectMapLocation('${loc.id}')"
                 role="button" tabindex="0"
                 aria-label="Select ${loc.name} at ${loc.address}">
              ${isCurrent ? '🏠' : '📍'}
              <div class="pin-label">${loc.name}</div>
            </div>
          `;
        }).join('')}

        <!-- Current location pulsing indicator (always visible) -->
        <div class="current-loc" aria-hidden="true"></div>

        <!-- Navigation simulation overlay container (populated by JS when active) -->
        <div id="map-nav-overlay" class="hidden absolute inset-0 nav-sim-overlay flex flex-col justify-center px-4 text-white"></div>
      </div>

      <!-- Selected location detail card -->
      ${selected ? `
        <div class="map-info-card">
          <div class="flex justify-between items-start">
            <div>
              <div class="font-semibold">${selected.name}</div>
              <div class="text-white/50 text-xs mt-0.5">${selected.address}</div>
            </div>
            <div class="text-right">
              <div class="text-xs text-white/50">ETA</div>
              <div class="text-[#00b4ff] font-semibold tabular-nums">${selected.eta}</div>
            </div>
          </div>
          <div class="mt-3 flex gap-2">
            <button onclick="startNavigation('${selected.id}')" 
                    class="flex-1 py-2 text-sm font-medium rounded-2xl bg-[#00b4ff] text-black active:opacity-90 transition"
                    aria-label="Start navigation to ${selected.name}">
              Start Navigation →
            </button>
            <button onclick="clearMapSelection()" 
                    class="px-4 py-2 text-sm rounded-2xl border border-white/20 hover:bg-white/5 active:bg-white/10"
                    aria-label="Deselect location">
              Close
            </button>
          </div>
        </div>
      ` : `
        <div class="text-center text-[11px] text-white/40 mt-1">Tap a pin or destination below to preview</div>
      `}

      <!-- Saved / Filtered destinations list -->
      <div class="mt-3 pb-5">
        <div class="flex items-center justify-between px-0.5 mb-1.5">
          <div class="text-[10px] tracking-[1px] text-white/50 font-medium">SAVED DESTINATIONS • ${filtered.length}</div>
          ${q ? `<button onclick="clearMapSearch()" class="text-[10px] text-[#00b4ff]">CLEAR</button>` : ''}
        </div>
        <div id="map-dest-list">
          ${filtered.map(loc => {
            const isSel = mapSelectedId === loc.id;
            return `
              <div onclick="selectMapLocation('${loc.id}')" 
                   class="map-dest-item ${isSel ? 'ring-1 ring-[#00b4ff]' : ''}"
                   role="button" tabindex="0"
                   aria-label="Select destination ${loc.name}">
                <span class="text-base">${loc.id === 'home' ? '🏠' : '📍'}</span>
                <div class="flex-1 min-w-0">
                  <div class="font-medium leading-tight">${loc.name}</div>
                  <div class="text-[10px] text-white/45 truncate">${loc.address}</div>
                </div>
                <div class="eta">${loc.eta}</div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="text-[10px] text-center text-white/30 mt-2">Interactive demo • Tap to select • Simulate live routing</div>
      </div>
    </div>
  `;

  // After render: attach keyboard support to pins for accessibility
  setTimeout(() => {
    const pins = container.querySelectorAll('.map-pin');
    pins.forEach(pin => {
      pin.addEventListener('keydown', (e: any) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const onclick = pin.getAttribute('onclick');
          if (onclick) {
            // crude but effective for demo: eval the onclick string (safe in this context)
            const idMatch = onclick.match(/'([^']+)'/);
            if (idMatch) selectMapLocation(idMatch[1]);
          }
        }
      });
    });
  }, 0);
}

// ============== MAPS HELPERS (functional interactive simulation) ==============

function filterMapLocations() {
  const content = document.getElementById('app-content')!;
  renderMaps(content);
}

function clearMapSearch() {
  const content = document.getElementById('app-content')!;
  const input = document.getElementById('map-search') as HTMLInputElement;
  if (input) input.value = '';
  renderMaps(content);
}

function selectMapLocation(id: string) {
  mapSelectedId = id;
  const content = document.getElementById('app-content')!;
  renderMaps(content);
}

function clearMapSelection() {
  mapSelectedId = null;
  const content = document.getElementById('app-content')!;
  renderMaps(content);
}

function startNavigation(id: string) {
  const loc = mapLocations.find(l => l.id === id);
  if (!loc) return;

  const content = document.getElementById('app-content')!;
  const viewport = document.getElementById('map-viewport')!;
  const overlay = document.getElementById('map-nav-overlay')!;

  // Subtle loading state first (polish)
  overlay.classList.remove('hidden');
  overlay.classList.add('flex');
  overlay.innerHTML = `
    <div class="text-center w-full px-2">
      <div class="mx-auto mb-2 w-6 h-6 border-2 border-white/30 border-t-[#00b4ff] rounded-full animate-spin"></div>
      <div class="text-sm font-medium">Calculating fastest route...</div>
      <div class="text-[11px] text-white/50 mt-0.5">Using real-time traffic data</div>
    </div>
  `;

  // Clear any prior timer
  if (navTimer) clearInterval(navTimer);

  setTimeout(() => {
    // Start the live simulation
    let progress = 8;
    let mins = parseInt(loc.eta) || 11;
    let km = (mins * 0.65).toFixed(1);

    overlay.innerHTML = `
      <div class="w-full">
        <div class="flex items-center justify-between text-xs mb-1 px-1">
          <div class="font-semibold">Navigating to ${loc.name}</div>
          <button onclick="cancelNavigation()" class="px-2 py-0.5 text-[10px] border border-white/40 rounded-full hover:bg-white/10">CANCEL</button>
        </div>
        <div class="h-1.5 bg-white/10 rounded overflow-hidden mb-1.5">
          <div id="route-bar" class="route-progress h-1.5 bg-[#00b4ff]" style="width: ${progress}%"></div>
        </div>
        <div class="flex justify-between text-xs tabular-nums px-1">
          <div><span id="nav-eta">${mins}</span> min</div>
          <div><span id="nav-km">${km}</span> km</div>
          <div class="text-emerald-400">LIVE</div>
        </div>
        <div class="mt-2 text-[10px] text-white/50 px-1 flex items-center gap-1">
          <span>🚗</span> <span>Route optimized • 2 lights • 1 charger stop avoided</span>
        </div>
      </div>
    `;

    // Live updating simulation
    navTimer = setInterval(() => {
      progress = Math.min(96, progress + 11 + Math.random() * 6);
      mins = Math.max(1, mins - 1);
      km = Math.max(0.2, parseFloat(km) - 0.6).toFixed(1);

      const bar = document.getElementById('route-bar');
      const etaEl = document.getElementById('nav-eta');
      const kmEl = document.getElementById('nav-km');

      if (bar) bar.style.width = progress + '%';
      if (etaEl) etaEl.textContent = String(mins);
      if (kmEl) kmEl.textContent = km;

      if (progress >= 95 || mins <= 1) {
        clearInterval(navTimer);
        navTimer = null;
        // Arrived state
        overlay.innerHTML = `
          <div class="text-center w-full">
            <div class="text-emerald-400 text-2xl mb-1">✓</div>
            <div class="font-semibold">Arrived at ${loc.name}</div>
            <div class="text-xs text-white/60 mt-0.5">Destination reached • Thank you for using Mex Maps</div>
            <button onclick="cancelNavigation(true)" class="mt-3 text-xs px-4 py-1.5 rounded-2xl border border-white/30">Done</button>
          </div>
        `;
        // auto reset after a moment
        setTimeout(() => {
          if (!overlay.classList.contains('hidden')) cancelNavigation(true);
        }, 3800);
      }
    }, 780);
  }, 380);
}

function cancelNavigation(resetSelection = false) {
  if (navTimer) {
    clearInterval(navTimer);
    navTimer = null;
  }
  const overlay = document.getElementById('map-nav-overlay');
  if (overlay) {
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
    overlay.innerHTML = '';
  }
  if (resetSelection) {
    mapSelectedId = null;
  }
  const content = document.getElementById('app-content')!;
  renderMaps(content);
}

// ============== DYNAMIC CAR VISUAL HELPER (for shared reactive use) ==============

function createDynamicCarVisual(options: { 
  mode?: 'side' | 'front' | 'top';
  lightsOn?: boolean; 
  brightness?: number; 
  doorsOpen?: boolean;
  color?: string;
} = {}): string {
  const { mode = 'front', lightsOn = false, brightness = 60, doorsOpen = false } = options;
  const glow = lightsOn ? `drop-shadow(0 0 ${Math.max(6, brightness / 5)}px #7dd3fc) drop-shadow(0 0 ${brightness / 7}px #bae6fd)` : '';
  
  if (mode === 'top') {
    return `
      <div class="relative w-[240px] h-[310px] mx-auto">
        <svg width="240" height="310" viewBox="0 0 240 310" class="text-white/90">
          <rect x="38" y="48" width="164" height="215" rx="32" fill="none" stroke="currentColor" stroke-width="2.75"/>
          <rect x="52" y="68" width="136" height="48" rx="6" fill="none" stroke="currentColor" stroke-width="1.25" opacity="0.55"/>
          <rect x="52" y="205" width="136" height="38" rx="6" fill="none" stroke="currentColor" stroke-width="1.25" opacity="0.55"/>
        </svg>
        ${doorsOpen ? `<div class="absolute top-[110px] text-[9px] text-amber-400/90 tracking-widest left-1/2 -translate-x-1/2">DOORS OPEN</div>` : ''}
      </div>`;
  }

  // Front view - using real car photo + multi-layered CSS glow overlays for dynamic headlights.
  // Refined positions/sizes/shapes/DRL to closely match realistic Mercedes headlight housings + signature DRL strips
  // from references/screens/light.png (low on body, flanking grille, elongated modern LED housings) when cropped in 252x148 container.
  // Multiple layers (soft ambient bloom + main beam + bright core + sharp DRL) for natural integration, no floating boxes.
  return `
    <div class="relative w-[252px] h-[148px] mx-auto bg-[#0c0c0c] rounded-3xl overflow-hidden border border-white/10">
      <div class="absolute inset-0 bg-[radial-gradient(#1f1f1f_.6px,transparent_1px)] bg-[length:2.5px_2.5px]"></div>
      
      <!-- Real photo base for correct proportions. Shifted object-position to better frame front/headlight area of 3/4 photo -->
      <img src="/references/cars/hero-e350.jpg" 
           class="absolute inset-0 w-full h-full object-cover"
           style="filter: brightness(0.82) contrast(1.08); object-position: 58% 50%;">
      
      <!-- Overlay to darken slightly for UI contrast -->
      <div class="absolute inset-0 bg-black/20"></div>

      <!-- Headlights: layered realistic Mercedes-style (soft outer bloom + main beam + DRL strip + core hotspot) 
           Positions tuned lower + wider for physical headlamp locations in photo + light.png reference -->
      ${lightsOn ? `
        <!-- LEFT soft ambient outer bloom (large diffused halo, heavily feathered to blend naturally into photo lighting) -->
        <div class="absolute" style="left:26px; top:67px; width:55px; height:32px; 
             background: radial-gradient(ellipse 82% 68% at 27% 40%, rgba(103,232,249,0.32) 0%, rgba(14,165,233,0.14) 42%, transparent 80%);
             border-radius: 9px 19px 13px 7px; filter: blur(3px);
             opacity: ${Math.min(0.62, brightness/78 + 0.12)};"></div>

        <!-- LEFT main beam (primary shaped housing glow - elongated realistic contour with strong directional gradient) -->
        <div class="absolute" style="left:37px; top:78px; width:37px; height:14px; 
             background: radial-gradient(ellipse 94% 60% at 21% 37%, #f0f9ff 0%, #67e8f9 20%, #0ea5e9 50%, #0369a1 76%, transparent 93%);
             box-shadow: 0 0 ${Math.max(8, brightness/4.6)}px 4px #67e8f9, 
                        0 0 ${brightness/2.9}px 12px #0284c8,
                        0 1px 3px rgba(15,23,42,0.45) inset;
             border-radius: 4px 17px 10px 3px;
             opacity: ${Math.min(0.9, brightness/55)};"></div>

        <!-- LEFT signature thin DRL strip (high-fidelity Mercedes LED running light - sharp, bright, positioned precisely at upper housing edge) -->
        <div class="absolute" style="left:35px; top:73.5px; width:41px; height:3.5px;
             background: linear-gradient(to right, transparent 6%, #f8fafc 16%, #e0f2fe 46%, #f8fafc 84%, transparent 94%);
             box-shadow: 0 0 ${Math.max(4, brightness/6.5)}px 1.5px #a5f3fc, 
                        0 0 ${brightness/4}px 5px #38bdf8;
             border-radius: 999px;
             opacity: ${Math.min(0.95, brightness/50 + 0.22)};"></div>

        <!-- LEFT bright core hotspot (intense projector simulation) -->
        ${brightness > 12 ? `
          <div class="absolute" style="left:46px; top:80px; width:14px; height:7.5px; background:#fff; 
               border-radius: 2px 6px 4px 1px; box-shadow: 0 0 2.5px 0.6px #bae6fd, 0 0 0.4px #fff; 
               opacity: ${Math.min(0.78, (brightness-2)/92)};"></div>
        ` : ''}

        <!-- RIGHT soft ambient outer bloom -->
        <div class="absolute" style="left:171px; top:67px; width:55px; height:32px; 
             background: radial-gradient(ellipse 82% 68% at 73% 40%, rgba(103,232,249,0.32) 0%, rgba(14,165,233,0.14) 42%, transparent 80%);
             border-radius: 19px 9px 7px 13px; filter: blur(3px);
             opacity: ${Math.min(0.62, brightness/78 + 0.12)};"></div>

        <!-- RIGHT main beam (primary shaped housing glow - mirrored) -->
        <div class="absolute" style="left:178px; top:78px; width:37px; height:14px; 
             background: radial-gradient(ellipse 94% 60% at 79% 37%, #f0f9ff 0%, #67e8f9 20%, #0ea5e9 50%, #0369a1 76%, transparent 93%);
             box-shadow: 0 0 ${Math.max(8, brightness/4.6)}px 4px #67e8f9, 
                        0 0 ${brightness/2.9}px 12px #0284c8,
                        0 1px 3px rgba(15,23,42,0.45) inset;
             border-radius: 17px 4px 3px 10px;
             opacity: ${Math.min(0.9, brightness/55)};"></div>

        <!-- RIGHT signature thin DRL strip -->
        <div class="absolute" style="left:176px; top:73.5px; width:41px; height:3.5px;
             background: linear-gradient(to right, transparent 6%, #f8fafc 16%, #e0f2fe 46%, #f8fafc 84%, transparent 94%);
             box-shadow: 0 0 ${Math.max(4, brightness/6.5)}px 1.5px #a5f3fc, 
                        0 0 ${brightness/4}px 5px #38bdf8;
             border-radius: 999px;
             opacity: ${Math.min(0.95, brightness/50 + 0.22)};"></div>

        <!-- RIGHT bright core hotspot -->
        ${brightness > 12 ? `
          <div class="absolute" style="left:192px; top:80px; width:14px; height:7.5px; background:#fff; 
               border-radius: 6px 2px 1px 4px; box-shadow: 0 0 2.5px 0.6px #bae6fd, 0 0 0.4px #fff; 
               opacity: ${Math.min(0.78, (brightness-2)/92)};"></div>
        ` : ''}
      ` : ''}

      <!-- Mercedes star area -->
      <div class="absolute left-1/2 top-[36px] -translate-x-1/2 text-white/50 text-[10px]">✦</div>

      <!-- Door open indicators -->
      ${doorsOpen ? `
        <div class="absolute left-2 top-1/2 -translate-y-1/2 text-amber-400 text-[8px] opacity-75">◀</div>
        <div class="absolute right-2 top-1/2 -translate-y-1/2 text-amber-400 text-[8px] opacity-75">▶</div>
      ` : ''}
      
      <div class="absolute bottom-1.5 left-0 right-0 text-center text-[9px] tracking-[1.5px] text-white/40">E350</div>
    </div>
  `;
}

// ============== BOOTSTRAP ==============

function initPhoneDemo() {
  // Initial render
  const content = document.getElementById('app-content')!;
  renderHome(content);
  setActiveNav('home');
  
  // Live clock
  updatePhoneTime();
  setInterval(updatePhoneTime, 30000);

  // Keyboard support for demo (h = home, c = control, u = utility, d = door, l = light, m = music)
  document.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'h') switchAppScreen('home');
    if (k === 'c') switchAppScreen('control');
    if (k === 'u') switchAppScreen('utility');
    if (k === 'd') switchAppScreen('door');
    if (k === 'l') switchAppScreen('light');
    if (k === 'm') switchAppScreen('maps');
    if (k === 's') switchAppScreen('settings');
  });

  // Bonus: clicking the phone frame header area resets to home
  const frame = document.getElementById('phone-frame');
  frame?.addEventListener('dblclick', () => switchAppScreen('home'));
}

function initEverything() {
  initPhoneDemo();
  initConfigurator();

  // Make sure first color swatch is marked active (already handled in init)
  // Seed a nice starting state
  console.log('%c[Mex] Smart Car website initialized — all Figma screens replicated as interactive demo.', 'color:#555');

  // Active section nav highlighting (premium UX)
  setTimeout(initActiveNav, 380);

  // Easter egg: konami-ish for fun
  let seq: string[] = [];
  document.addEventListener('keydown', (e) => {
    seq.push(e.key);
    if (seq.slice(-5).join('') === 'ArrowUpArrowUpArrowDownArrowDownEnter') {
      seq = [];
      document.getElementById('app-demo')?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        state.temp = 19;
        state.autoDrive = true;
        switchAppScreen('home');
      }, 600);
    }
  });
}

// Auto-start
initEverything();

// Expose some helpers for debugging / future agents
(window as any).MEX = { state, switchAppScreen, randomizeConfig, showFullConfigurator };

// Make key navigation and interaction functions global so inline onclick handlers in index.html and render templates work
(window as any).switchAppScreen = switchAppScreen;
(window as any).toggleMusicPlay = toggleMusicPlay;
(window as any).prevTrack = prevTrack;
(window as any).nextTrack = nextTrack;
(window as any).setMusicVolume = setMusicVolume;
(window as any).playTrack = playTrack;

// Expose other frequently used handlers from the phone demo
(window as any).toggleStartCar = toggleStartCar;
(window as any).toggleFeature = toggleFeature;
(window as any).toggleLights = toggleLights;
(window as any).toggleDoors = toggleDoors;
(window as any).toggleDoor = toggleDoor;
(window as any).toggleLight = toggleLight;
(window as any).updateHeadlightBrightness = updateHeadlightBrightness;
(window as any).selectMusicTrack = selectMusicTrack;
(window as any).logoutDemo = logoutDemo;
(window as any).saveProfileAndReturn = saveProfileAndReturn;
(window as any).selectFullPackage = selectFullPackage;

// Expose new Utility quick actions
(window as any).quickLockAll = quickLockAll;
(window as any).toggleTrunkQuick = toggleTrunkQuick;
(window as any).playHorn = playHorn;
(window as any).quickToggleHeadlights = quickToggleHeadlights;

// Expose Maps interactive helpers for the fully functional screen
(window as any).filterMapLocations = filterMapLocations;
(window as any).selectMapLocation = selectMapLocation;
(window as any).startNavigation = startNavigation;
(window as any).cancelNavigation = cancelNavigation;
(window as any).clearMapSelection = clearMapSelection;

// =============================================
// FULL CONFIGURATOR MODAL + ENHANCED EXPERIENCE
// =============================================

let fullConfigState = {
  carColor: 'obsidian',
  wheelType: 'amg19',
  package: 'standard',
  addons: { audio: false, assist: false, interior: false, air: false }
};

function showFullConfigurator() {
  const modal = document.getElementById('full-config-modal')!;
  modal.classList.remove('hidden');
  modal.classList.add('flex');

  // Seed from main state if possible
  fullConfigState.carColor = state.carColor || 'obsidian';
  fullConfigState.wheelType = state.wheelType || 'amg19';
  fullConfigState.package = state.package || 'standard';

  initFullConfiguratorUI();
  // default addons off for demo freshness
  fullConfigState.addons = { audio: false, assist: false, interior: false, air: false };
  syncAddonCheckboxes();
  updateFullConfigurator();
}

function hideFullConfigurator() {
  const modal = document.getElementById('full-config-modal')!;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function initFullConfiguratorUI() {
  // Colors
  const colorContainer = document.getElementById('full-color-swatches')!;
  colorContainer.innerHTML = '';
  Object.entries(colors).forEach(([key, c]) => {
    const sw = document.createElement('div');
    sw.className = `config-swatch w-9 h-9 ${fullConfigState.carColor === key ? 'active' : ''}`;
    sw.style.backgroundColor = c.hex;
    sw.title = c.name;
    sw.onclick = () => {
      fullConfigState.carColor = key;
      updateFullConfigurator();
    };
    colorContainer.appendChild(sw);
  });

  // Wheels
  const wheelContainer = document.getElementById('full-wheel-options')!;
  wheelContainer.innerHTML = '';
  Object.entries(wheels).forEach(([key, w]) => {
    const btn = document.createElement('button');
    btn.className = `config-option-btn text-xs px-4 py-2 rounded-2xl border ${fullConfigState.wheelType === key ? 'border-[#00b4ff] bg-[#00b4ff]/10' : 'border-white/15 hover:border-white/40'}`;
    btn.textContent = w.name;
    btn.onclick = () => {
      fullConfigState.wheelType = key;
      updateFullConfigurator();
    };
    wheelContainer.appendChild(btn);
  });

  // Richer package options
  const pkgContainer = document.getElementById('full-package-options')!;
  pkgContainer.innerHTML = `
    <div onclick="selectFullPackage('standard')" class="flex justify-between px-4 py-3 rounded-2xl border cursor-pointer ${fullConfigState.package==='standard'?'border-[#00b4ff] bg-[#00b4ff]/5':'border-white/10 hover:bg-white/5'}">
      <div>Standard — Included</div><div class="text-white/50">¥0</div>
    </div>
    <div onclick="selectFullPackage('premium')" class="flex justify-between px-4 py-3 rounded-2xl border cursor-pointer ${fullConfigState.package==='premium'?'border-[#00b4ff] bg-[#00b4ff]/5':'border-white/10 hover:bg-white/5'}">
      <div>Premium Comfort Package</div><div class="text-[#00b4ff]">+¥42,000</div>
    </div>
    <div onclick="selectFullPackage('amg')" class="flex justify-between px-4 py-3 rounded-2xl border cursor-pointer ${fullConfigState.package==='amg'?'border-[#00b4ff] bg-[#00b4ff]/5':'border-white/10 hover:bg-white/5'}">
      <div>AMG Line + Sport Suspension</div><div class="text-[#00b4ff]">+¥78,000</div>
    </div>
  `;
}

function selectFullPackage(pkg: string) {
  fullConfigState.package = pkg;
  // Re-render packages
  initFullConfiguratorUI();
  updateFullConfigurator();
}

function updateFullConfigurator() {
  const preview = document.getElementById('full-config-preview')!;
  const priceEl = document.getElementById('full-config-price')!;
  const breakdown = document.getElementById('price-breakdown')!;

  const color = colors[fullConfigState.carColor];
  const wheel = wheels[fullConfigState.wheelType];

  let pkgPrice = 0;
  if (fullConfigState.package === 'premium') pkgPrice = 42000;
  if (fullConfigState.package === 'amg') pkgPrice = 78000;

  let addonTotal = 0;
  const addonsList: string[] = [];
  if ((document.getElementById('addon-audio') as HTMLInputElement)?.checked) { addonTotal += 28000; addonsList.push('Burmester 3D Audio +28k'); }
  if ((document.getElementById('addon-assist') as HTMLInputElement)?.checked) { addonTotal += 19000; addonsList.push('Driver Assist Pro +19k'); }
  if ((document.getElementById('addon-interior') as HTMLInputElement)?.checked) { addonTotal += 34000; addonsList.push('Executive Interior +34k'); }
  if ((document.getElementById('addon-air') as HTMLInputElement)?.checked) { addonTotal += 8000; addonsList.push('Air Balance +8k'); }

  const total = 586000 + color.price + wheel.price + pkgPrice + addonTotal;

  // Beautiful large preview
  const imgSrc = fullConfigState.carColor === 'silver' ? '/references/cars/silver-e350.jpg' : '/references/cars/hero-e350.jpg';
  preview.innerHTML = `
    <img src="${imgSrc}" class="absolute inset-0 w-full h-full object-cover" alt="${color.name}">
    <div class="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/75"></div>
    <div class="absolute bottom-5 left-5">
      <div class="font-medium text-xl tracking-tight">${color.name}</div>
      <div class="text-xs text-white/70">${wheel.name} • ${fullConfigState.package.toUpperCase()}</div>
    </div>
    <div class="absolute top-4 right-4 px-3 py-1 text-xs rounded-full bg-black/70 border border-white/20">${total.toLocaleString('en-US')} ¥</div>
  `;

  priceEl.textContent = '¥ ' + total.toLocaleString('en-US');

  // Breakdown
  let bdHTML = `<div class="flex justify-between"><span>Base E350</span><span>¥586,000</span></div>`;
  if (color.price) bdHTML += `<div class="flex justify-between"><span>${color.name}</span><span>+¥${color.price.toLocaleString()}</span></div>`;
  if (wheel.price) bdHTML += `<div class="flex justify-between"><span>${wheel.name}</span><span>+¥${wheel.price.toLocaleString()}</span></div>`;
  if (pkgPrice) bdHTML += `<div class="flex justify-between"><span>${fullConfigState.package.toUpperCase()} Package</span><span>+¥${pkgPrice.toLocaleString()}</span></div>`;
  addonsList.forEach(a => bdHTML += `<div class="flex justify-between text-[11px]"><span>${a}</span></div>`);
  breakdown.innerHTML = bdHTML;
}

// Sync addon checkboxes on init
function syncAddonCheckboxes() {
  const audio = document.getElementById('addon-audio') as HTMLInputElement;
  const assist = document.getElementById('addon-assist') as HTMLInputElement;
  const interior = document.getElementById('addon-interior') as HTMLInputElement;
  const air = document.getElementById('addon-air') as HTMLInputElement;
  if (audio) audio.checked = fullConfigState.addons.audio;
  if (assist) assist.checked = fullConfigState.addons.assist;
  if (interior) interior.checked = fullConfigState.addons.interior;
  if (air) air.checked = fullConfigState.addons.air;
}

function saveFullConfigDemo() {
  const totalEl = document.getElementById('full-config-price')?.textContent || '';
  alert(`Configuration saved locally (demo).\n\n${totalEl}\n\nIn production this would email a beautiful PDF and save to your Mex account.`);
}

function requestQuoteFromConfig() {
  hideFullConfigurator();
  setTimeout(() => {
    showBookModal();
  }, 220);
}

// =============================================
// PREMIUM POLISH: Active Navigation + Smoothness
// =============================================

function initActiveNav() {
  const navLinks = document.querySelectorAll('nav a[href^="#"]') as NodeListOf<HTMLAnchorElement>;
  const sections = Array.from(document.querySelectorAll('section[id]'));

  if (!navLinks.length || !sections.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          const href = link.getAttribute('href');
          link.classList.toggle('active', href === `#${id}`);
        });
      }
    });
  }, { threshold: 0.35, rootMargin: "-80px 0px -30% 0px" });

  sections.forEach(sec => observer.observe(sec));

  // Click handling for instant active state
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });
}

// (Active nav already initialized inside initEverything for reliability)

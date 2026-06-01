// ════════════════════════════════════════════════════════════
//  ❤ MINI PLAYER — Renderer Logic
// ════════════════════════════════════════════════════════════

// ─── DOM References ────────────────────────────────────────
const audio       = document.getElementById('main-audio');
const playBtn     = document.getElementById('play');
const prevBtn     = document.getElementById('prev');
const nextBtn     = document.getElementById('next');
const addBtn      = document.getElementById('add-btn');
const trackName   = document.getElementById('track-name');
const artistName  = document.getElementById('artist-name');
const seekBar     = document.getElementById('seek-bar');
const seekFill    = document.getElementById('seek-fill');
const volSlider   = document.getElementById('vol-slider');
const themeToggle = document.getElementById('theme-toggle');
const minBtn      = document.getElementById('min-btn');
const closeBtn    = document.getElementById('close-btn');
const currentTimeDisplay = document.getElementById('current-time');
const totalTimeDisplay   = document.getElementById('total-time');

// ─── Playlist Drawer DOM References ────────────────────────
const queueBtn        = document.getElementById('queue-btn');
const closeDrawerBtn  = document.getElementById('close-drawer-btn');
const playlistDrawer  = document.getElementById('playlist-drawer');
const drawerList      = document.getElementById('drawer-list');

// ─── State ─────────────────────────────────────────────────
let playlist     = [];
let currentIndex = 0;
let isPlaying    = false;

// ─── Available Themes (matches CSS classes) ────────────────
const themes = [
  'theme-rgb',
  'theme-midnight',
  'theme-rose',
  'theme-emerald',
  'theme-arctic',
  'theme-neon',
  'theme-aurora',
  'theme-hyperpop'
];
let currentTheme = 0; // starts on theme-rgb (set in HTML)

// ════════════════════════════════════════════════════════════
//  Window Controls
// ════════════════════════════════════════════════════════════
minBtn.addEventListener('click', () => window.serene.control('min'));
closeBtn.addEventListener('click', () => window.serene.control('close'));

// ════════════════════════════════════════════════════════════
//  File Selection (＋ button)
// ════════════════════════════════════════════════════════════
addBtn.addEventListener('click', async () => {
  const result = await window.serene.selectFiles();
  if (result.canceled || result.filePaths.length === 0) return;

  const startIndex = playlist.length;
  result.filePaths.forEach(fp => playlist.push(fp));

  // If nothing was loaded before, load the first newly-added track
  if (startIndex === 0) {
    loadTrack(0);
  }
  // Update the counter display
  updateTrackInfo();
});

// ════════════════════════════════════════════════════════════
//  Track Loading
// ════════════════════════════════════════════════════════════
function loadTrack(index) {
  if (playlist.length === 0) return;
  currentIndex = index;
  audio.src = playlist[currentIndex];
  seekFill.style.width = '0%';
  currentTimeDisplay.textContent = '00:00';
  totalTimeDisplay.textContent = '00:00';
  updateTrackInfo();
}

async function updateTrackInfo() {
  const discImg = document.querySelector('#disc-art img');
  const discContainer = document.getElementById('disc-art');
  const counterDisplay = document.getElementById('track-counter');
  
  if (playlist.length === 0) {
    trackName.textContent  = '𝓜𝓤𝓢𝓘𝓒';
    artistName.textContent = '𝓢𝔂𝓼𝓽𝓮𝓶 𝓡𝓮𝓪𝓭𝔂';
    if (counterDisplay) counterDisplay.textContent = '';
    discImg.src = 'assets/disc2.png';
    discContainer.classList.remove('has-art');
    
    trackName.classList.remove('scroll-active');
    trackName.style.removeProperty('--scroll-dist');
    artistName.classList.remove('scroll-active');
    artistName.style.removeProperty('--scroll-dist');
    return;
  }
  
  const filePath = playlist[currentIndex];
  
  // Fetch metadata including embedded cover art
  const metadata = await window.serene.getMetadata(filePath);
  console.log('Audio metadata loaded:', metadata);
  
  // Set album cover if it exists, otherwise fall back to assets/disc2.png
  if (metadata && metadata.albumArt) {
    discImg.src = metadata.albumArt;
    discContainer.classList.add('has-art');
  } else {
    discImg.src = 'assets/disc2.png';
    discContainer.classList.remove('has-art');
  }

  // Set track title (trim aggressively using centralized cleaner)
  let cleanName = '';
  if (metadata && metadata.title) {
    cleanName = cleanMetadataString(metadata.title, false);
  } else {
    cleanName = cleanMetadataString(filePath, false);
  }

  // Set artist details (trim aggressively using centralized cleaner)
  let artist = '';
  if (metadata && metadata.artist) {
    artist = cleanMetadataString(metadata.artist, true);
  } else {
    artist = 'Unknown Artist';
  }

  trackName.textContent  = cleanName;
  artistName.textContent = artist;
  if (counterDisplay) counterDisplay.textContent = `• Track ${currentIndex + 1}/${playlist.length}`;

  // Unified, high-end marquee calculation after DOM settles
  setTimeout(() => {
    applyMarquee(trackName);
    applyMarquee(artistName);
  }, 150);

  // Synchronize drawer selection if the drawer is open
  renderDrawer();
}

// Unified, high-end marquee width calculator helper
function applyMarquee(element) {
  if (!element) return;
  element.classList.remove('scroll-active');
  element.style.removeProperty('--scroll-dist');
  
  const containerWidth = element.parentElement.clientWidth;
  const textWidth      = element.scrollWidth;
  
  // Trigger scrolling if the text length exceeds the visible container
  if (textWidth > containerWidth * 0.95) {
    // Elegant left translate scroll target
    const scrollDist = (containerWidth * 0.9) - textWidth;
    element.style.setProperty('--scroll-dist', `${scrollDist}px`);
    element.classList.add('scroll-active');
  }
}

// ════════════════════════════════════════════════════════════
//  Play / Pause
// ════════════════════════════════════════════════════════════
playBtn.addEventListener('click', () => {
  if (playlist.length === 0) return;

  if (isPlaying) {
    pause();
  } else {
    play();
  }
});

// ════════════════════════════════════════════════════════════
//  Playlist Drawer Logic & Interactions
// ════════════════════════════════════════════════════════════
queueBtn.addEventListener('click', () => {
  playlistDrawer.classList.toggle('open');
  if (playlistDrawer.classList.contains('open')) {
    renderDrawer();
  }
});

closeDrawerBtn.addEventListener('click', () => {
  playlistDrawer.classList.remove('open');
});

// Generates the playlist list inside the drawer dynamically
function renderDrawer() {
  drawerList.innerHTML = '';
  
  if (playlist.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.style.textAlign = 'center';
    emptyMsg.style.padding = '40px 10px';
    emptyMsg.style.color = 'var(--subtext)';
    emptyMsg.style.fontSize = '12px';
    emptyMsg.innerHTML = '<b>𝓢𝓸𝓷𝓰 𝓠𝓾𝓮𝓾𝓮 𝓔𝓶𝓹𝓽𝔂</b><br><span style="font-size:10px;opacity:0.8;">Drag music here or click ＋ to add</span>';
    drawerList.appendChild(emptyMsg);
    return;
  }
  
  playlist.forEach((filePath, index) => {
    const cleanName = cleanMetadataString(filePath, false);

    // Create queue-item container
    const itemDiv = document.createElement('div');
    itemDiv.className = `queue-item ${index === currentIndex ? 'active' : ''}`;
    
    // Create meta content
    const metaDiv = document.createElement('div');
    metaDiv.className = 'item-meta';
    
    const indexSpan = document.createElement('span');
    indexSpan.className = 'item-index';
    indexSpan.textContent = (index + 1).toString().padStart(2, '0');
    
    const titleSpan = document.createElement('span');
    titleSpan.className = 'item-title';
    titleSpan.textContent = cleanName;
    
    metaDiv.appendChild(indexSpan);
    metaDiv.appendChild(titleSpan);
    
    // Create remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-item-btn';
    removeBtn.innerHTML = '✖';
    removeBtn.title = 'Remove from Queue';
    
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent playing the track when deleting it!
      removeTrackFromQueue(index);
    });
    
    itemDiv.appendChild(metaDiv);
    itemDiv.appendChild(removeBtn);
    
    // Double click or single click to play immediately
    itemDiv.addEventListener('click', () => {
      if (index === currentIndex) {
        // Toggle play/pause if clicking the currently active track
        playBtn.click();
      } else {
        loadTrack(index);
        play();
      }
    });
    
    drawerList.appendChild(itemDiv);
  });
}

function removeTrackFromQueue(index) {
  const wasPlaying = isPlaying;
  
  // Remove item from array
  playlist.splice(index, 1);
  
  if (playlist.length === 0) {
    // Queue emptied completely — reset player state
    currentIndex = 0;
    pause();
    audio.src = '';
    seekFill.style.width = '0%';
    currentTimeDisplay.textContent = '00:00';
    totalTimeDisplay.textContent = '00:00';
    updateTrackInfo();
    renderDrawer();
    return;
  }
  
  if (index === currentIndex) {
    // We deleted the currently playing song!
    // Play next song in queue, or wrap back to the first song if we deleted the tail song
    currentIndex = index % playlist.length;
    loadTrack(currentIndex);
    if (wasPlaying) play();
  } else if (index < currentIndex) {
    // Shifting array indices to left, decrement currentIndex to keep highlight pointing to same song
    currentIndex--;
    updateTrackInfo();
  } else {
    // Normal update of counter
    updateTrackInfo();
  }
  
  renderDrawer();
}

// ─── Real-Time Audio Visualizer State ───────────────────────
let audioCtx = null;
let analyser = null;
let source = null;
let dataArray = null;
let visualizerId = null;

function initVisualizer() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64; // Yields 32 frequency bins
    
    source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    
    dataArray = new Uint8Array(analyser.frequencyBinCount);
  } catch (err) {
    console.warn("Web Audio API not supported or blocked:", err);
  }
}

function animateBars() {
  if (!isPlaying) {
    resetVisualizerBars();
    return;
  }
  
  visualizerId = requestAnimationFrame(animateBars);
  
  if (analyser && dataArray) {
    analyser.getByteFrequencyData(dataArray);
    const bars = document.querySelectorAll('.eq-bar');
    const discContainer = document.getElementById('disc-art');
    
    // 1. Map active frequency bins to our 4 EQ bars
    const bands = [1, 3, 5, 8]; 
    bars.forEach((bar, index) => {
      const freqVal = dataArray[bands[index]] || 0;
      // Scale frequency amplitude (0-255) to a scaleY factor (0.2 to 1.3)
      const scale = 0.2 + (freqVal / 255) * 1.15;
      bar.style.transform = `scaleY(${scale})`;
    });

    // 2. Real-Time Ambient Bass-Glow Pulse
    // Bass frequency is index 1 of the byte frequency data array
    const bassVal = dataArray[1] || 0;
    // Map bass intensity (0-255) to a glow spread (10px to 45px)
    const glowValue = 10 + (bassVal / 255) * 35;
    discContainer.style.setProperty('--bass-glow', `${glowValue}px`);
  }
}

function resetVisualizerBars() {
  if (visualizerId) {
    cancelAnimationFrame(visualizerId);
    visualizerId = null;
  }
  const bars = document.querySelectorAll('.eq-bar');
  bars.forEach(bar => {
    bar.style.transform = 'scaleY(0.2)';
  });
  
  // Reset bass glow to static default
  const discContainer = document.getElementById('disc-art');
  if (discContainer) {
    discContainer.style.setProperty('--bass-glow', '15px');
  }
}

function play() {
  // Safe AudioContext start/resume on user interaction
  initVisualizer();
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  
  audio.play();
  isPlaying = true;
  playBtn.textContent = '𝓟𝓪𝓾𝓼𝓮';
  document.documentElement.classList.add('playing');
  
  // Start the visualizer loop
  animateBars();
}

function pause() {
  audio.pause();
  isPlaying = false;
  playBtn.textContent = '𝓟𝓵𝓪𝔂';
  document.documentElement.classList.remove('playing');
  
  // Stop and reset visualizer loop
  resetVisualizerBars();
}

// ════════════════════════════════════════════════════════════
//  Previous / Next
// ════════════════════════════════════════════════════════════
prevBtn.addEventListener('click', () => {
  if (playlist.length === 0) return;
  // If more than 3s into track, restart; otherwise go previous
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
  loadTrack(currentIndex);
  if (isPlaying) audio.play();
});

nextBtn.addEventListener('click', () => {
  if (playlist.length === 0) return;
  currentIndex = (currentIndex + 1) % playlist.length;
  loadTrack(currentIndex);
  if (isPlaying) audio.play();
});

// ════════════════════════════════════════════════════════════
//  Seek Bar
// ════════════════════════════════════════════════════════════
// ─── Format Time Helper (seconds → mm:ss) ──────────────────
function formatTime(seconds) {
  if (isNaN(seconds) || seconds === Infinity) return '00:00';
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

audio.addEventListener('loadedmetadata', () => {
  totalTimeDisplay.textContent = formatTime(audio.duration);
});

audio.addEventListener('timeupdate', () => {
  if (isSeeking) return; // Prevent old playback position from resetting bar visually during dragging
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  seekFill.style.width = pct + '%';
  currentTimeDisplay.textContent = formatTime(audio.currentTime);
});

seekBar.addEventListener('click', (e) => {
  if (!audio.duration) return;
  const rect = seekBar.getBoundingClientRect();
  const pct  = (e.clientX - rect.left) / rect.width;
  audio.currentTime = pct * audio.duration;
});

// Drag-to-seek support
let isSeeking = false;
let dragPct = 0; // Caches target percentage to set on drag release

seekBar.addEventListener('mousedown', (e) => {
  isSeeking = true;
  seekTo(e);
});
document.addEventListener('mousemove', (e) => {
  if (isSeeking) seekTo(e);
});
document.addEventListener('mouseup', () => {
  if (isSeeking) {
    // Apply final playback seek exactly once on release, eliminating stutter
    audio.currentTime = dragPct * audio.duration;
    isSeeking = false;
  }
});

function seekTo(e) {
  if (!audio.duration) return;
  const rect = seekBar.getBoundingClientRect();
  let pct = (e.clientX - rect.left) / rect.width;
  pct = Math.max(0, Math.min(1, pct));
  dragPct = pct;
  seekFill.style.width = (pct * 100) + '%';
  currentTimeDisplay.textContent = formatTime(pct * audio.duration); // Update visual counter in real-time
}

// ════════════════════════════════════════════════════════════
//  Auto-Next on Track End
// ════════════════════════════════════════════════════════════
audio.addEventListener('ended', () => {
  if (currentIndex < playlist.length - 1) {
    currentIndex++;
    loadTrack(currentIndex);
    audio.play();
  } else {
    // Playlist complete — reset to beginning
    currentIndex = 0;
    loadTrack(0);
    pause();
    seekFill.style.width = '0%';
  }
});

// ════════════════════════════════════════════════════════════
//  Volume Control
// ════════════════════════════════════════════════════════════
audio.volume = parseFloat(volSlider.value);
volSlider.addEventListener('input', () => {
  audio.volume = parseFloat(volSlider.value);
});

// ════════════════════════════════════════════════════════════
//  Theme Cycling (☀ button)
// ════════════════════════════════════════════════════════════
themeToggle.addEventListener('click', () => {
  currentTheme = (currentTheme + 1) % themes.length;
  // Preserve the 'playing' state class when swapping themes
  const wasPlaying = document.documentElement.classList.contains('playing');
  document.documentElement.className = themes[currentTheme];
  if (wasPlaying) document.documentElement.classList.add('playing');
});

// ════════════════════════════════════════════════════════════
//  Keyboard Shortcuts
// ════════════════════════════════════════════════════════════
document.addEventListener('keydown', (e) => {
  switch (e.code) {
    case 'Space':
      e.preventDefault();
      playBtn.click();
      break;
    case 'ArrowRight':
      nextBtn.click();
      break;
    case 'ArrowLeft':
      prevBtn.click();
      break;
    case 'ArrowUp':
      e.preventDefault();
      volSlider.value = Math.min(1, parseFloat(volSlider.value) + 0.05);
      audio.volume = parseFloat(volSlider.value);
      break;
    case 'ArrowDown':
      e.preventDefault();
      volSlider.value = Math.max(0, parseFloat(volSlider.value) - 0.05);
      audio.volume = parseFloat(volSlider.value);
      break;
  }
});

// ════════════════════════════════════════════════════════════
//  Drag and Drop Files (Instant Desktop Integration)
// ════════════════════════════════════════════════════════════
document.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.stopPropagation();
  document.body.classList.add('drag-active');
});

document.addEventListener('dragleave', (e) => {
  e.preventDefault();
  e.stopPropagation();
  document.body.classList.remove('drag-active');
});

document.addEventListener('drop', async (e) => {
  e.preventDefault();
  e.stopPropagation();
  document.body.classList.remove('drag-active');
  
  const files = Array.from(e.dataTransfer.files);
  const audioExtensions = ['.mp3', '.wav', '.flac', '.m4a'];
  
  // Electron populates absolute system paths in the file.path parameter securely
  const filePaths = files
    .map(file => file.path)
    .filter(filePath => {
      if (!filePath) return false;
      const ext = filePath.slice(filePath.lastIndexOf('.')).toLowerCase();
      return audioExtensions.includes(ext);
    });
    
  if (filePaths.length === 0) return;
  
  const startIndex = playlist.length;
  filePaths.forEach(fp => playlist.push(fp));
  
  if (startIndex === 0) {
    loadTrack(0);
  }
  
  updateTrackInfo();
});

// ─── Centralized Aggressive Metadata & Track Title Sanitization Helper ──────
function cleanMetadataString(str, isArtist = false) {
  if (!str) return isArtist ? 'Unknown Artist' : 'Unknown Track';
  
  let clean = str;
  
  // 1. Extract filename if a path is passed
  if (clean.includes('\\') || clean.includes('/')) {
    clean = clean.split('\\').pop().split('/').pop();
    clean = clean.replace(/\.[^/.]+$/, ''); // Remove file extension
  }
  
  // 2. Extremely Aggressive Trimming and Sanitization Regex rules
  clean = clean
    // Remove website links inside brackets/parentheses, e.g. [iSongs.info], (SenSongsMp3.Co), (sitename.online)
    .replace(/[\(\[]\s*[a-zA-Z0-9\.\-_]+\s*\.(com|info|org|net|co|in|xyz|club|me|net\.in|cc|to|site|online|ws|bz|co\.in|us)\s*[\)\]]/gi, '')
    // Remove trailing website domains, e.g. -SenSongsMp3.Com, _iSongs.info
    .replace(/[-_\s]+[a-zA-Z0-9_]+\.(com|info|org|net|co|in|xyz|club|me|net\.in|cc|to|site|online|ws|bz|co\.in|us)/gi, '')
    // Remove bitrates & format encoding tags in brackets/parentheses, e.g. (MP3 320kbps), [160k], (128 Kbps), (MP3 160K)
    .replace(/[\(\[]\s*(mp3|m4a|flac|wav|aac)?\s*\d{2,3}\s*(k|kbps|kb)?\s*[\)\]]/gi, '')
    // Remove common clutter/advertisement terms inside brackets/parentheses
    .replace(/[\(\[]\s*(official|oficial|hq|hd|free|download|lyric|lyrics|video|audio|master|stereo|mono|clean|dirty|original|promotional|leak|exclusive|single|clip|full|track)\s*(video|audio|download|mix|edit|version|release|hq|hd|track|song)?\s*[\)\]]/gi, '')
    // Remove duplicate empty brackets left behind
    .replace(/[\(\[]\s*[\)\]]/g, '')
    // Replace duplicate hyphens, colons, and underscores with single space
    .replace(/::/g, ' ')
    .replace(/[-]{2,}/g, ' ')
    .replace(/[_]/g, ' ');

  // 3. Leading numbers strip (only for titles, preserve numbers inside artist names!)
  if (!isArtist) {
    clean = clean.replace(/^\s*\d+\s*[-_.:\s]+\s*/g, '');
  }
  
  // 4. Collapse consecutive spaces and trim
  clean = clean.replace(/\s+/g, ' ').trim();
  
  return clean || (isArtist ? 'Unknown Artist' : 'Unknown Track');
}

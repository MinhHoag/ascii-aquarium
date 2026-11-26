const get = id => document.getElementById(id);
const canvas = get('tank');
const ctx = canvas.getContext('2d');
const palette = ['#62ffe4','#ffad63','#fa92e4','#98a9ff','#fff18b','#78d7ff'];
const parts = {
  heads: ['o>', 'O>', '.>'],
  bodies: ['-===-', '(oo)', '/###\\', '<==>'],
  fins: ['', '', '^', '', '', '^', ''],
  tails: ['><', '>><', '><-', '><']
};
const bodyProfiles = ['pear','puffer','carp','oval'];
const bodyLengths = [3,4,5,6,7];
const maxFish = 16;
const fish = [];

function makeFish(i,x,y,random=false) {
  const pick = (options, offset) => options[random ?
    Math.floor(Math.random()*options.length) : (i+offset)%options.length];
  const head = pick(parts.heads,0);
  const template = pick(parts.bodies,1);
  const length = pick(bodyLengths,2);
  const profile = pick(bodyProfiles,0);
  const interior = template.slice(1,-1);
  const body = template[0]+Array.from({length:length-2},(_,index)=>
    interior[Math.floor(index*interior.length/(length-2))]).join('')+template.at(-1);
  const fin = pick(parts.fins,2);
  const tail = pick(parts.tails,3);
  return {
    head,body,fin,tail,length,profile,
    color:palette[i%palette.length],
    x,y,dx:0,dy:0, dir:i%2 ? -1 : 1, pace:.87+(i%6)*.047,
    passUntil:0, passBites:0, coastUntil:0, biteUntil:0, fullUntil:0, belly:0, fullness:0
  };
}

function saveNamedFish() {
  const named = fish.filter(f=>f.name).map(f=>({
    name:f.name,head:f.head,body:f.body,fin:f.fin,tail:f.tail,length:f.length,
    profile:f.profile,color:f.color,x:f.x,y:f.y,dir:f.dir,pace:f.pace
  }));
  try {
    localStorage.setItem('ascii-aquarium-named-fish',JSON.stringify(named));
    get('fish-name-status').textContent = '';
  } catch {
    get('fish-name-status').textContent = 'Could not save fish on this device.';
  }
}

function renderFishRoster() {
  const count = fish.filter(f=>f.name).length;
  get('named-count').textContent = count+'/4 named';
  get('fish-roster').replaceChildren(...fish.map((f,i)=>{
    const row = document.createElement('form');
    const preview = document.createElement('span');
    preview.textContent = f.tail+f.body+f.head;
    preview.style.color = f.color;
    const input = document.createElement('input');
    input.value = f.name || '';
    input.maxLength = 20;
    input.placeholder = 'Fish '+(i+1);
    input.setAttribute('aria-label','Name fish '+(i+1));
    row.onsubmit = event=>event.preventDefault();
    input.oninput = ()=>{
      const name = input.value.trim();
      if (name && !f.name && fish.filter(other=>other.name).length>=4) {
        get('fish-name-status').textContent = 'All four name slots are filled. Clear a saved name to free one.';
        input.value = '';
        return;
      }
      f.name = name;
      saveNamedFish();
      get('named-count').textContent = fish.filter(other=>other.name).length+'/4 named';
    };
    row.append(preview,input);
    return row;
  }));
}

function updateSchool() {
  get('fish-count').textContent = '('+fish.length+'/'+maxFish+')';
  get('add-fish').disabled = fish.length >= maxFish;
  renderFishRoster();
}

function resetSchool() {
  const named = fish.filter(f=>f.name);
  fish.length = 0;
  fish.push(...named);
  for (let i=named.length;i<6;i++) {
    fish.push(makeFish(i,.12+Math.random()*.76,.2+Math.random()*.6,true));
  }
  updateSchool();
}

get('add-fish').onclick = () => {
  if (fish.length >= maxFish) return;
  fish.push(makeFish(fish.length,.16+Math.random()*.68,.24+Math.random()*.53,true));
  updateSchool();
};
get('reset-tank').onclick = () => {
  pellets = [];
  resetSchool();
};
try {
  const saved = JSON.parse(localStorage.getItem('ascii-aquarium-named-fish') || '[]');
  if (Array.isArray(saved)) {
    for (const entry of saved.slice(0,4)) {
      if (!entry || typeof entry.name !== 'string' ||
          !['head','body','tail','color','profile'].every(key=>typeof entry[key]==='string')) continue;
      const f = makeFish(fish.length,.2+Math.random()*.6,.3+Math.random()*.4);
      for (const key of ['head','body','tail','fin','color','profile']) {
        if (typeof entry[key]==='string') f[key] = entry[key].slice(0,40);
      }
      f.name = entry.name.slice(0,20);
      f.length = f.body.length;
      fish.push(f);
    }
  }
} catch {}
resetSchool();
get('fish-menu').ontoggle = ()=>{ if (get('fish-menu').open) renderFishRoster(); };
const seagrass = [
  ['   /   ', '  (  / ', '   )/  ', ' \\ |   ', '  \\| / ', ' __|/__'],
  ['    /  ', ' /  )  ', ' ( / / ', '  )|/  ', ' \\ |   ', ' _\\|__ '],
  ['    /  ', ' / (   ', ' (  )  ', '  \\/ / ', '   |/  ', ' __|__ ']
];
const decorations = [
  {name:'Rock', at:.22, color:'#aaa', rows:['   ____',' _/ .  \\','/ .   . \\','\\_______/']},
  {name:'Pink coral', at:.44, coral:true, color:'#ff458c', tips:'#ff9be9', rows:[' Y    Y',' |  Y |',' \\  |/ ','  \\ |  ','   \\|  ','  __|_ ']},
  {name:'Orange coral', at:.57, coral:true, color:'#ff773d', tips:'#ffda65', rows:[' * *  *',' \\ | */','  \\|/  ','   |   ',' _/|\\_ ']},
  {name:'Treasure chest', at:.80, color:'#d8a34d', rows:[' .--------.','/_________/|','|===|#|===||','|_________|/']},
  ...seagrass.map((rows,i)=>({
    name:['Lime seagrass','Mint seagrass','Green seagrass'][i],rows,
    color:['#b2ff63','#4dffab','#37df91'][i],plant:true,grass:true
  }))
];
const stockLayout = [
  ...decorations.slice(0,4).map((piece,type)=>({type,at:piece.at,level:1})),
  ...[.045,.17,.34,.65,.87,.95].map((at,i)=>({type:4+i%3,at,level:1}))
];
const firstPersonal = decorations.length;
const globeReadoutRow = 3;
const globeOutline = [
  '+-----------------+',
  '|                 |',
  '|                 |',
  '|                 |',
  '|                 |',
  '|                 |',
  '|                 |',
  '+-----------------+'
];
decorations.push(
  {name:'Words', kind:'words', floating:true, resizable:true, color:'#e4e4e4', rows:['ASCII']},
  {name:'Photo frame', kind:'photo', resizable:true, color:'#b97450', rows:['+--------------+','|              |','|              |','|              |','|              |','|              |','+--------------+']},
  {name:'Clock', kind:'clock', resizable:true, color:'#92e7ff', rows:['+----------+','| 12:00:00 |','+----------+']},
  {name:'Snow globe timer', kind:'timer', resizable:true, color:'#bdeeff', rows:globeOutline},
  {name:'Now playing', kind:'turntable', resizable:true, color:'#c1d7da',
    rows:['+---------------+','|   .----.   o  |','|  / .--. \\ /   |','|  \\ \'--\' /\'    |','|   \'----\'      |','+---------------+']}
);
decorations.push(
  {name:'Basalt arch', at:.22, color:'#92a7bb', rows:[
    '     .---.__', '  __/ .   . \\', ' / .  .---.  |', '|  . /     | |', '|___/      |_/']},
  {name:'Sea fan', at:.44, coral:true, color:'#f36bb5', tips:'#ffb1d9', rows:[
    '  *-*-* *-*-*', ' /|/|/ Y \\|\\|\\', ' \\|-+--+--+-|/', '  \\_|\\ | /|_/', '     \\| |/', '    __|_|__']},
  {name:'Iron anchor', color:'#aab9c9', rows:[
    '      (o)', '       |', '   ====+====', '       |', '  ^    |    ^', '  |\\   |   /|', '    \\__+__/']},
  {name:'Sunken observatory', at:.80, color:'#d3b281', rows:[
    '       _', '    .-^- -.', '   /   O   \\', '  /___|_|___\\', '  | []   [] |', ' _|___[_]___|_']},
  {name:'Ribbon kelp', color:'#a0ec83', plant:true, rows:[
    '        _/', '  __   /_/ ', ' /_/  /_/  ', '   \\ /_/', '    Y /', '    |/', '  __|__']},
  {name:'Feather fern', color:'#65e5b4', plant:true, rows:[
    '      ^', '    < | >', '   <==|==>', '    <=|=>', '     <|>', '      |', '   ___|___']},
  {name:'Eelgrass tuft', color:'#70c99c', plant:true, grass:true, rows:[
    '  /     /', ' /   / /', ' | / |/  /', '  Y  |  /', '   \\ | /', '  __\\|/___']},
  {name:'Pearl shell', color:'#f2bddc', rows:[
    "   _.-''-._", ' _/ . (o) . \\_', ' \\____________/']},
  {name:'Amphora', color:'#db9a71', rows:[
    '     .---.', '     |___|', '  .--|   |--.', '  | /=====\\ |', '   / .:.:. \\', '   \\_______/']},
  {name:'Broken lighthouse', color:'#c0cad5', rows:[
    '      /\\', '   .-/__\\-.', '   |  ()  |', '   +------+', '    |////|', '    |    |', '   /|////|', '  /_|_[]_|__', ' /__________\\']}

);
const layoutKey = 'ascii-aquarium-layout';
function loadLayout() {
  try {
    const saved = JSON.parse(localStorage.getItem(layoutKey));
    if (Array.isArray(saved)) {
      return saved.slice(0,48).map(item=>{
        if (!item) return item;
        const type = typeof item.assetName === 'string' ?
          decorations.findIndex(asset=>asset.name === item.assetName) :
          item.type;
        return {...item,type};
      }).filter(item=>item && decorations[item.type] &&
        Number.isInteger(item.type) && Number.isFinite(item.at) && Number.isFinite(item.level));
    }
  } catch {
    // The editor also works when browser storage is unavailable.
  }
  return stockLayout.map(item=>({...item}));
}
const layout = loadLayout();
const armedTimers = new WeakSet(layout.filter(item=>decorations[item.type].kind === 'timer' && item.endsAt>Date.now()));
const dropResetTimers = new WeakSet();
let timerAudio = null;
const editor = get('customize');
const placedAssets = get('placed-assets');
const tabs = ['tab-decor','tab-installed','tab-fish','tab-wallpaper'].map(get);
let selected = null, drag = null, personalType = firstPersonal, photoData = null, photoLoading = false;
const frame = canvas.closest('.frame');
const fullscreenButton = get('fullscreen');
let fullscreenFallback = window.aquariumStartsFullscreen === true, editorIdleTimer;

function resetEditorIdle() {
  clearTimeout(editorIdleTimer);
  if (!frame.classList.contains('is-fullscreen') || !editor.open) return;
  editorIdleTimer = setTimeout(()=>{
    if (drag || photoLoading) {
      resetEditorIdle();
      return;
    }
    if (editor.contains(document.activeElement)) editor.querySelector('summary').focus({preventScroll:true});
    editor.open = false;
  },10000);
}

function updateFullscreen() {
  const active = document.fullscreenElement === frame || fullscreenFallback;
  if (active && !frame.classList.contains('is-fullscreen')) editor.open = false;
  frame.classList.toggle('is-fullscreen',active);
  const label = active ? 'Exit fullscreen' : 'Enter fullscreen';
  fullscreenButton.setAttribute('aria-label',label);
  fullscreenButton.title = label;
  fullscreenButton.setAttribute('aria-pressed',String(active));
  window.chrome?.webview?.postMessage({type:'aquarium-fullscreen',active});
  resize();
  resetEditorIdle();
}

fullscreenButton.onclick = async ()=>{
  if (document.fullscreenElement === frame) {
    await document.exitFullscreen();
  } else if (fullscreenFallback) {
    fullscreenFallback = false;
  } else {
    try {
      await frame.requestFullscreen();
    } catch {
      fullscreenFallback = true;
    }
  }
  updateFullscreen();
};
document.addEventListener('fullscreenchange',updateFullscreen);
document.addEventListener('keydown',event=>{
  if (event.key !== 'Escape' || !fullscreenFallback) return;
  fullscreenFallback = false;
  updateFullscreen();
});
editor.addEventListener('toggle',()=>{
  resetEditorIdle();
  if (!editor.open) {
    editor.style.translate = '';
    panelOffset = {x:0,y:0};
  }
});
let panelOffset = {x:0,y:0}, panelDrag = null, panelMoved = false;
const panelHandle = editor.querySelector('summary');
panelHandle.addEventListener('pointerdown',event=>{
  if (!editor.open || !frame.classList.contains('is-fullscreen') || event.button !== 0) return;
  panelDrag = {x:event.clientX,y:event.clientY,offset:{...panelOffset},box:editor.getBoundingClientRect()};
  panelMoved = false;
  panelHandle.setPointerCapture(event.pointerId);
});
panelHandle.addEventListener('pointermove',event=>{
  if (!panelDrag) return;
  const dx = event.clientX-panelDrag.x, dy = event.clientY-panelDrag.y;
  if (Math.hypot(dx,dy)>4) panelMoved = true;
  if (!panelMoved) return;
  const box = panelDrag.box;
  panelOffset = {
    x:panelDrag.offset.x+Math.max(8-box.left,Math.min(innerWidth-8-box.right,dx)),
    y:panelDrag.offset.y+Math.max(8-box.top,Math.min(innerHeight-8-box.bottom,dy))
  };
  editor.style.translate = panelOffset.x+'px '+panelOffset.y+'px';
  resetEditorIdle();
});
panelHandle.addEventListener('lostpointercapture',()=>{panelDrag=null;});
panelHandle.addEventListener('click',event=>{
  if (panelMoved) {
    event.preventDefault();
    panelMoved = false;
  }
});
for (const event of ['pointermove','pointerdown','wheel','keydown','input','focusin','scroll']) {
  editor.addEventListener(event,resetEditorIdle,{passive:true});
}
let passLimit = 3, passCooldown = .7;
try {
  const settings = JSON.parse(localStorage.getItem('ascii-aquarium-feeding'));
  if (settings) {
    if (Number.isInteger(settings.limit) && settings.limit>=1 && settings.limit<=6) passLimit = settings.limit;
    if (settings.cooldown>=.2 && settings.cooldown<=3) passCooldown = Number(settings.cooldown);
  }
} catch {}
get('pass-limit').value = passLimit;
get('pass-cooldown').value = passCooldown;
function saveFeedingSettings() {
  const limit = Number(get('pass-limit').value);
  const cooldown = Number(get('pass-cooldown').value);
  if (Number.isInteger(limit) && limit>=1 && limit<=6) passLimit = limit;
  if (cooldown>=.2 && cooldown<=3) passCooldown = cooldown;
  get('pass-limit').value = passLimit;
  get('pass-cooldown').value = passCooldown;
  try {
    localStorage.setItem('ascii-aquarium-feeding',JSON.stringify({limit:passLimit,cooldown:passCooldown}));
  } catch {}
}
get('pass-limit').onchange = get('pass-cooldown').onchange = saveFeedingSettings;

function showTab(tab) {
  for (const button of tabs) {
    const active = button === tab;
    button.setAttribute('aria-selected',String(active));
    button.tabIndex = active ? 0 : -1;
    get(button.getAttribute('aria-controls')).hidden = !active;
  }
}
tabs.forEach((tab,i)=>{
  tab.onclick = ()=>showTab(tab);
  tab.onkeydown = event=>{
    const next = {ArrowLeft:(i+tabs.length-1)%tabs.length,ArrowRight:(i+1)%tabs.length,
      Home:0,End:tabs.length-1}[event.key];
    if (next === undefined) return;
    event.preventDefault();
    showTab(tabs[next]);
    tabs[next].focus();
  };
});

function showPersonal(show) {
  get('asset-library').hidden = show;
  get('personal-items').hidden = !show;
  get('show-decor').setAttribute('aria-pressed',String(!show));
  get('show-personal').setAttribute('aria-pressed',String(show));
}
get('show-decor').onclick = ()=>showPersonal(false);
get('show-personal').onclick = ()=>showPersonal(true);

function assetCard(asset,action) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'asset-card';
  card.onclick = action;
  const preview = document.createElement('pre');
  preview.className = 'asset-preview';
  preview.style.color = asset.color;
  preview.setAttribute('aria-hidden','true');
  preview.textContent = asset.rows.join('\n');
  const label = document.createElement('span');
  label.textContent = asset.name;
  card.append(preview,label);
  return card;
}
const addCards = decorations.flatMap((asset,type)=>{
  if (asset.kind) return [];
  const card = assetCard(asset,()=>addItem(type));
  card.setAttribute('aria-label','Add '+asset.name);
  return card;
});
get('asset-library').replaceChildren(...addCards);
const personalCards = decorations.filter(asset=>asset.kind).map(asset=>assetCard(asset,()=>{
  personalType = decorations.indexOf(asset);
  updatePersonal();
}));
get('personal-library').replaceChildren(...personalCards);

function clockText(clock) {
  return [clock.getHours(),clock.getMinutes(),clock.getSeconds()]
    .map(n=>String(n).padStart(2,'0')).join(':');
}
function timerText(seconds) {
  return [Math.floor(seconds/60),seconds%60].map(n=>String(n).padStart(2,'0')).join(':');
}

function timerDuration(item) {
  return Number.isInteger(item.duration) && item.duration>=60 && item.duration<=5940 ? item.duration : 300;
}

function globeRows(seconds,duration,phase) {
  const rows = globeOutline.map(line=>[...line]);
  const remaining = Math.min(1,seconds/duration);
  const center = (row,text)=>rows[row].splice(Math.floor((rows[row].length-text.length)/2),text.length,...text);
  const flakes = seconds ? 3+Math.round(remaining*10) : 0;
  for (let i=0;i<flakes;i++) {
    const row = 1+(i*5+Math.floor(phase*2+i*.36))%6;
    if (row === globeReadoutRow) continue;
    const col = 2+(i*13+Math.floor((Math.sin(i+phase)+1)*2))%(rows[row].length-4);
    rows[row][col] = i%4 ? '.' : '*';
  }
  center(globeReadoutRow,timerText(seconds));
  if (!seconds) center(1,'SHAKE OR DROP');
  rows[4].splice(8,2,...'/\\');
  rows[5].splice(7,4,...'/__\\');
  rows[6].splice(7,4,...'|[]|');
  const outline = rows.map(row=>row.join(''));
  const width = outline[0].length-2;
  const fill = Math.ceil(remaining*width);
  outline[outline.length-1] = '+'+'='.repeat(fill)+'-'.repeat(width-fill)+'+';
  return outline;
}

function unlockTimerAudio() {
  const Audio = window.AudioContext ?? window.webkitAudioContext;
  if (!Audio) return;
  if (!timerAudio) timerAudio = new Audio();
  if (timerAudio.state === 'suspended') void timerAudio.resume().catch(()=>{});
}

function timerBeep() {
  if (timerAudio?.state !== 'running') return;
  const start = timerAudio.currentTime;
  const tone = timerAudio.createOscillator();
  const volume = timerAudio.createGain();
  tone.frequency.value = 760;
  volume.gain.setValueAtTime(.0001,start);
  volume.gain.exponentialRampToValueAtTime(.075,start+.016);
  volume.gain.exponentialRampToValueAtTime(.0001,start+.18);
  tone.connect(volume);
  volume.connect(timerAudio.destination);
  tone.start(start);
  tone.stop(start+.19);
}

function checkTimers() {
  const now = Date.now();
  let beep = false;
  for (const item of layout) {
    if (!armedTimers.has(item) || item.endsAt>now) continue;
    armedTimers.delete(item);
    beep = true;
  }
  if (beep) timerBeep();
}

function finishedTimer(item) {
  return decorations[item.type].kind === 'timer' && Date.now()>=item.endsAt;
}

function resetTimer(item) {
  if (!finishedTimer(item)) return false;
  if (armedTimers.has(item)) timerBeep();
  item.duration = timerDuration(item);
  item.endsAt = Date.now()+item.duration*1000;
  armedTimers.add(item);
  dropResetTimers.delete(item);
  saveLayout();
  return true;
}

document.addEventListener('pointerdown',()=>{
  if (layout.some(item=>armedTimers.has(item))) unlockTimerAudio();
}, {passive:true});

const photoColumns = 72;
const photoRows = 58;
const importPhotoColumns = 44;
const importPhotoRows = 34;
const photoRowPitch = .72;
const photoWidthScale = .9;
const shades = ' .:-=+*#%@';
const photoShades = '.,:;irs+=*#%@';
function photoFrame(rows) {
  const columns = Math.min(photoColumns,String(rows[0] ?? '').length);
  const edge = '+'+'-'.repeat(columns)+'+';
  return [edge,...rows.slice(0,photoRows).map(row=>'|'+String(row).slice(0,columns).padEnd(columns)+'|'),edge];
}

function photoRuns(line,colors) {
  const runs = [];
  const stride = typeof colors === 'string' && colors.length === line.length*6 ? 6 : 3;
  for (let i=0;i<line.length;i++) {
    const code = typeof colors === 'string' ? colors.slice(i*stride,i*stride+stride) : '';
    const color = /^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(code) ? '#'+code : '#eee';
    const last = runs.at(-1);
    if (last?.color === color) last.text += line[i];
    else runs.push({color,text:line[i],at:i});
  }
  return runs;
}

function paintPhotoPreview(element,photo) {
  element.textContent = '';
  const rows = photoFrame(photo.rows);
  rows.forEach((line,row)=>{
    if (row === 0 || row === rows.length-1) {
      element.append(line);
    } else {
      element.append('|');
      for (const run of photoRuns(line.slice(1,-1),photo.colors[row-1])) {
        const span = document.createElement('span');
        span.style.color = run.color;
        span.textContent = run.text;
        element.append(span);
      }
      element.append('|');
    }
    if (row < rows.length-1) element.append('\n');
  });
}

async function convertPhoto(url,columns,rowCount,aspect) {
  const image = new Image();
  image.src = url;
  await image.decode();
  const working = document.createElement('canvas');
  const scale = Math.min(1,480/image.naturalHeight,854/image.naturalWidth);
  working.height = Math.max(1,Math.round(image.naturalHeight*scale));
  working.width = Math.max(1,Math.round(image.naturalWidth*scale));
  const source = working.getContext('2d');
  source.imageSmoothingQuality = 'high';
  source.drawImage(image,0,0,working.width,working.height);
  const framed = aspect === undefined;
  let cropWidth = working.width, cropHeight = working.height;
  if (framed) {
    const gridAspect = (working.width/working.height)*photoRowPitch/(photoWidthScale*cell/unit);
    columns = Math.max(1,Math.min(importPhotoColumns,Math.round(importPhotoRows*gridAspect)));
    rowCount = Math.max(1,Math.min(importPhotoRows,Math.round(columns/gridAspect)));
  } else {
    cropWidth = Math.min(working.width,working.height*aspect);
    cropHeight = cropWidth/aspect;
  }
  const thumb = document.createElement('canvas');
  thumb.width = columns;
  thumb.height = rowCount;
  const dc = thumb.getContext('2d');
  if (!framed) {
    dc.fillStyle = '#000';
    dc.fillRect(0,0,columns,rowCount);
  }
  dc.imageSmoothingQuality = 'high';
  dc.drawImage(working,(working.width-cropWidth)*.5,(working.height-cropHeight)*.5,
    cropWidth,cropHeight,0,0,columns,rowCount);
  const pixels = dc.getImageData(0,0,columns,rowCount).data;
  const rows = [], colors = [];
  for (let y=0;y<rowCount;y++) {
    let row = '', colorRow = '';
    for (let x=0;x<columns;x++) {
      const i = (y*columns+x)*4;
      const [r,g,b] = pixels.subarray(i,i+3);
      const peak = Math.max(r,g,b);
      const luma = r*.2126+g*.7152+b*.0722;
      const ramp = framed ? photoShades : shades;
      const tone = framed ? luma*.8+peak*.2 : luma;
      row += framed && pixels[i+3]<20 ? ' ' : ramp[Math.round(Math.sqrt(tone/255)*(ramp.length-1))];
      const lift = framed ? Math.max(0,64-peak*.7) : 0;
      colorRow += [r,g,b].map(channel=>Math.round(channel+lift).toString(16).padStart(2,'0')).join('');
    }
    rows.push(row);
    colors.push(colorRow);
  }
  return {rows,colors};
}

let lastPreviewPhoto;
function updatePersonal() {
  const type = decorations[personalType].kind;
  for (const field of ['word','image','timer']) {
    get(field+'-field').hidden = type !== {word:'words',image:'photo',timer:'timer'}[field];
  }
  personalCards.forEach((card,i)=>card.setAttribute('aria-pressed',String(i+firstPersonal===personalType)));
  const word = get('word-input').value.trim();
  const minutes = Number(get('timer-input').value);
  const validTime = Number.isInteger(minutes) && minutes>=1 && minutes<=99;
  personalCards[0].firstChild.textContent = word || 'Your words';
  personalCards[2].firstChild.textContent = clockText(new Date());
  personalCards[3].firstChild.classList.add('globe-preview');
  const previewSeconds = validTime ? minutes*60 : 300;
  personalCards[3].firstChild.textContent = globeRows(previewSeconds,previewSeconds,0).join('\n');
  get('timer-help').hidden = type !== 'timer';
  const preview = personalCards[1].firstChild;
  preview.classList.toggle('photo-preview',Boolean(photoData));
  const largePreview = get('ascii-photo-preview');
  largePreview.hidden = type !== 'photo' || !photoData;
  if (lastPreviewPhoto !== photoData) {
    lastPreviewPhoto = photoData;
    if (photoData) {
      paintPhotoPreview(preview,photoData);
      paintPhotoPreview(largePreview,photoData);
    } else {
      preview.textContent = '+----------+\n|  PHOTO   |\n+----------+';
      largePreview.textContent = '';
    }
  }
  get('add-personal').disabled = layout.length >= 48 ||
    (type === 'words' && !word) || (type === 'photo' && (!photoData || photoLoading)) ||
    (type === 'timer' && !validTime);
}
get('word-input').oninput = updatePersonal;
get('timer-input').oninput = updatePersonal;
get('image-input').onchange = async event=>{
  const input = event.currentTarget;
  if (photoLoading) return;
  const file = input.files[0];
  const message = get('personal-status');
  message.hidden = true;
  photoData = null;
  if (!file) {
    updatePersonal();
    return;
  }
  photoLoading = input.disabled = true;
  updatePersonal();
  let url;
  try {
    if (file.size>8*1024*1024) throw Error('Choose an image under 8 MB.');
    url = URL.createObjectURL(file);
    photoData = await convertPhoto(url);
  } catch (error) {
    message.textContent = file.size>8*1024*1024 ? error.message : 'Could not open that image.';
    message.hidden = false;
  } finally {
    if (url) URL.revokeObjectURL(url);
    photoLoading = input.disabled = false;
    updatePersonal();
  }
};
get('add-personal').onclick = ()=>{
  if (get('add-personal').disabled) return;
  const kind = decorations[personalType].kind;
  const extra = kind === 'words' ? {text:get('word-input').value.trim()} :
    kind === 'photo' ? {ascii:photoData.rows,asciiColors:photoData.colors,chunky:true} :
    kind === 'timer' ? {duration:Number(get('timer-input').value)*60} : {};
  if (kind === 'timer') extra.endsAt = Date.now()+extra.duration*1000;
  addItem(personalType,extra);
};

function saveLayout() {
  try {
    localStorage.setItem(layoutKey,JSON.stringify(layout.map(item=>({...item,assetName:decorations[item.type].name}))));
  } catch {
    // Changes remain available for this visit.
  }
}

function updateEditor() {
  const duplicates = new Map();
  placedAssets.replaceChildren(...layout.map(item=>{
    const asset = decorations[item.type];
    const row = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.onclick = ()=>selectDecoration(item);
    const preview = document.createElement('span');
    preview.className = 'placed-icon';
    preview.style.color = appearanceColor(item,asset);
    preview.setAttribute('aria-hidden','true');
    if (asset.kind === 'photo' && item.ascii?.length) {
      const rows = item.ascii;
      const thumbnail = Array.from({length:5},(_,i)=>{
        const line = rows[Math.round(i*(rows.length-1)/4)];
        return '|'+Array.from({length:11},(_,j)=>line[Math.round(j*(line.length-1)/10)] ?? ' ').join('')+'|';
      });
      preview.textContent = ['+-----------+',...thumbnail,'+-----------+'].join('\n');
    } else {
      preview.textContent = asset.rows.join('\n');
    }
    const label = document.createElement('span');
    const name = asset.kind === 'words' ? item.text || asset.name : asset.name;
    const number = (duplicates.get(name) ?? 0)+1;
    duplicates.set(name,number);
    label.textContent = name+(number > 1 ? ' '+number : '');
    button.append(preview,label);
    row.append(button);
    return row;
  }));
  const count = layout.length;
  get('placed-count').textContent = count+' placed';
  selectDecoration(selected);
  for (const card of addCards) card.disabled = count >= 48;
  updatePersonal();
}

function selectDecoration(item) {
  selected = item;
  Array.from(placedAssets.children).forEach((row,i)=>
    row.firstChild.setAttribute('aria-pressed',String(layout[i] === item)));
  get('remove-decoration').disabled = !item;
  const asset = item && decorations[item.type];
  get('item-appearance').hidden = !asset?.kind;
  get('resize-hint').hidden = !asset?.resizable;
  if (!asset?.kind) return;
  get('item-color-label').textContent = asset.kind === 'words' ? 'Text color' : 'Frame color';
  get('item-color').value = appearanceColor(item,asset);
  get('item-size').value = appearanceSize(item);
  get('item-size-value').textContent = appearanceSize(item)+'%';
}

function appearanceColor(item,asset) {
  return /^#[0-9a-f]{6}$/i.test(item.color ?? '') ? item.color : asset.color;
}
function appearanceSize(item) {
  if (Number.isFinite(item.size) && item.size>=60 && item.size<=175) return item.size;
  return decorations[item.type].kind === 'photo' ? 130 : 100;
}
function changeAppearance() {
  if (!selected || !decorations[selected.type].kind) return;
  const index = scenery.findIndex(piece=>piece.item === selected);
  const old = scenery[index];
  const previousSize = selected.size;
  selected.color = get('item-color').value;
  selected.size = Number(get('item-size').value);
  const piece = makeScenery(selected,layout.indexOf(selected));
  placeDecoration(piece,old.x+old.span*.5,old.base);
  if (personalOverlap(piece,scenery)) {
    selected.size = previousSize;
    old.color = selected.color;
  } else {
    scenery[index] = piece;
    storePosition(piece);
  }
  get('item-size').value = appearanceSize(selected);
  get('item-size-value').textContent = appearanceSize(selected)+'%';
  const badge = placedAssets.children[layout.indexOf(selected)].firstChild.firstChild;
  badge.style.color = selected.color;
  saveLayout();
}
get('item-color').oninput = get('item-size').oninput = changeAppearance;

function addItem(type,extra={}) {
  if (layout.length >= 48) return;
  const asset = decorations[type];
  const size = asset.plant || asset.coral ? 75+Math.floor(Math.random()*61) : 100;
  const heightScale = asset.grass ? .75+Math.random()*.55 : 1;
  const item = {type,size,heightScale,at:.44+Math.random()*.12,level:asset.kind ? .65 : 1,...extra};
  layout.push(item);
  if (decorations[type].kind === 'timer' && item.endsAt>Date.now()) {
    armedTimers.add(item);
    unlockTimerAudio();
  }
  selected = item;
  buildScenery();
  const added = scenery.find(piece=>piece.item === item);
  if (added) {
    added.dropTarget = added.floating ? added.base : null;
    added.dropping = true;
    added.base = (added.rows.length-1)*added.size*added.rowPitch+added.size;
    added.fallSpeed = 0;
    item.level = added.base/height;
  }
  updateEditor();
  saveLayout();
  if (decorations[type].kind === 'turntable') refreshTrack();
}
get('remove-decoration').onclick = () => {
  if (!selected) return;
  layout.splice(layout.indexOf(selected),1);
  selected = null;
  buildScenery();
  updateEditor();
  saveLayout();
};
updateEditor();

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {x:(event.clientX-rect.left)*width/rect.width,y:(event.clientY-rect.top)*height/rect.height};
}

function resizeBounds(piece) {
  return {left:piece.x-5, right:piece.x+piece.span+5,
    top:sceneryRow(piece,0).y-piece.size*.9-4, bottom:piece.base+6};
}

function resizeHandles(piece) {
  const {left,right,top,bottom} = resizeBounds(piece);
  return [
    {x:left,y:top,anchorX:right,anchorY:bottom,cursor:'nwse-resize'},
    {x:right,y:top,anchorX:left,anchorY:bottom,cursor:'nesw-resize'},
    {x:left,y:bottom,anchorX:right,anchorY:top,cursor:'nesw-resize'},
    {x:right,y:bottom,anchorX:left,anchorY:top,cursor:'nwse-resize'}
  ];
}

function resizeHandleAt(x,y) {
  if ((!editor.open && !frame.classList.contains('is-fullscreen')) || !selected ||
      !decorations[selected.type].resizable) return null;
  const piece = scenery.find(piece=>piece.item === selected);
  return resizeHandles(piece).find(handle=>Math.hypot(x-handle.x,y-handle.y)<=16);
}

canvas.onpointerdown = event => {
  if (event.button !== 0) return;
  const {x,y} = canvasPoint(event);
  const handle = resizeHandleAt(x,y);
  if (handle) {
    drag = {handle,item:selected,pointer:event.pointerId,startX:x,startY:y,size:appearanceSize(selected)};
    canvas.style.cursor = handle.cursor;
    canvas.setPointerCapture(event.pointerId);
    return;
  }
  const hits = scenery.filter(piece=>{
    const box = piece.resizable ? resizeBounds(piece) :
      {left:piece.x-4,right:piece.x+piece.span+4,top:sceneryRow(piece,0).y-piece.size,bottom:piece.base+6};
    return x>=box.left && x<=box.right && y>=box.top && y<=box.bottom;
  });
  const piece = hits.find(piece=>piece.item === selected && piece.kind === 'photo') ?? hits.at(-1);
  if (!piece) {
    selectDecoration(null);
    return;
  }
  if (!frame.classList.contains('is-fullscreen')) editor.open = true;
  showTab(get('tab-installed'));
  selectDecoration(piece.item);
  resetEditorIdle();
  dropResetTimers.delete(piece.item);
  drag = {item:piece.item,pointer:event.pointerId,dx:piece.x+piece.span*.5-x,dy:piece.base-y,
    startX:x,startY:y,shakeX:x,shakeAt:event.timeStamp,direction:0,reversals:0,moved:false};
  canvas.setPointerCapture(event.pointerId);
};
canvas.onpointermove = event => {
  const {x,y} = canvasPoint(event);
  if (!drag) {
    canvas.style.cursor = resizeHandleAt(x,y)?.cursor ?? '';
    return;
  }
  if (event.pointerId !== drag.pointer) return;
  if (drag.handle) resizeDecoration(drag,x,y);
  else {
    const piece = scenery.find(piece=>piece.item === drag.item);
    if (!piece) return;
    if (Math.hypot(x-drag.startX,y-drag.startY)>=unit) drag.moved = true;
    moveStack(piece,x+drag.dx,y+drag.dy);
    if (finishedTimer(drag.item)) checkShake(piece,x,event.timeStamp);
  }
};
canvas.onpointercancel = () => {
  if (drag) drag.moved = false;
};
canvas.onlostpointercapture = () => {
  if (drag) {
    if (drag.moved && !drag.handle && finishedTimer(drag.item)) {
      const piece = scenery.find(piece=>piece.item === drag.item);
      if (piece) {
        const nearSurface = Math.max(height*.30,
          height*.15+(1+(piece.rows.length-1)*.13)*piece.size+unit);
        if (sceneryRow(piece,0).y<nearSurface &&
            gravelContact(piece.x+piece.span*.5)-piece.base>unit*2) {
          dropResetTimers.add(drag.item);
        }
      }
    }
    saveLayout();
  }
  drag = null;
  canvas.style.cursor = '';
  resetEditorIdle();
};

function checkShake(piece,x,at) {
  if (at-drag.shakeAt>1700) {
    drag.shakeAt = at;
    drag.shakeX = x;
    drag.direction = drag.reversals = 0;
  }
  const distance = x-drag.shakeX;
  if (Math.abs(distance)<Math.max(12,Math.min(25,piece.span*.16))) return;
  const direction = Math.sign(distance);
  if (drag.direction && direction !== drag.direction && ++drag.reversals >= 3) {
    resetTimer(drag.item);
  }
  drag.direction = direction;
  drag.shakeX = x;
}

function resizeDecoration(gesture,x,y) {
  const {handle,item,size,startX,startY} = gesture;
  const previousSize = item.size;
  const diagonalX = handle.x-handle.anchorX, diagonalY = handle.y-handle.anchorY;
  const scale = 1+((x-startX)*diagonalX+(y-startY)*diagonalY)/(diagonalX*diagonalX+diagonalY*diagonalY);
  const allowedWidth = diagonalX>0 ? width-4-handle.anchorX : handle.anchorX-4;
  const allowedHeight = diagonalY>0 ? gravelContact((handle.x+handle.anchorX)*.5)+6-handle.anchorY :
    handle.anchorY-(height*.14+8);
  const maxScale = Math.min((allowedWidth-10)/(Math.abs(diagonalX)-10),
    (allowedHeight-10)/(Math.abs(diagonalY)-10));
  const maxSize = Math.max(size,Math.floor(size*maxScale));
  item.size = Math.max(60,Math.min(175,maxSize,Math.round(size*scale)));
  const index = scenery.findIndex(piece=>piece.item === item);
  const piece = makeScenery(item,layout.indexOf(item));
  const bounds = resizeBounds(piece);
  const frameWidth = bounds.right-bounds.left, frameHeight = bounds.bottom-bounds.top;
  const centerX = handle.anchorX+Math.sign(diagonalX)*frameWidth*.5;
  const baseY = handle.anchorY+(diagonalY>0 ? frameHeight : 0)-6;
  placeDecoration(piece,centerX,baseY);
  if (personalOverlap(piece,scenery)) {
    item.size = previousSize;
    return;
  }
  scenery[index] = piece;
  storePosition(piece);
  get('item-size').value = item.size;
  get('item-size-value').textContent = item.size+'%';
}
canvas.onkeydown = event => {
  const step = {ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
  if (!editor.open || !selected || !step) return;
  const piece = scenery.find(piece=>piece.item === selected);
  event.preventDefault();
  moveDecoration(piece,piece.x+piece.span*.5+step[0]*unit,piece.base+step[1]*unit);
  saveLayout();
  resetEditorIdle();
};
const food = [{glyph:'*',color:'#ffd966'},{glyph:'+',color:'#ff779f'}];
const mirror = line => [...line].reverse().map(c => ({'<':'>','>':'<','(':')',')':'(','/':'\\','\\':'/','o':'o'})[c] ?? c).join('');
const paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
const gravelRowHeight = 10;
let time = 0, previous = performance.now();
let meals = null, pellets = [];
let width, height, unit, cell, scenery = [];
const deckColumns = 45;
let track = {status:'idle',title:'',artist:'',artworkKey:''}, recordArtwork = null, recordAngle = 0;
let readingTrack = false;

async function refreshTrack() {
  if (readingTrack || !layout.some(item=>decorations[item.type].kind === 'turntable')) return;
  readingTrack = true;
  try {
    const response = await fetch('/api/now-playing?knownArtwork='+encodeURIComponent(track.artworkKey),
      {cache:'no-store',signal:AbortSignal.timeout(4500)});
    if (!response.ok) throw Error();
    const next = await response.json();
    if (next.artworkKey !== track.artworkKey) {
      recordArtwork = null;
      recordAngle = 0;
    }
    track = next;
    if (next.artwork) recordArtwork = await convertPhoto(next.artwork,61,37,1).catch(()=>null);
  } catch {
    track = {status:'unavailable',title:'',artist:'',artworkKey:''};
    recordArtwork = null;
  } finally {
    readingTrack = false;
  }
}
function resize() {
  width = canvas.clientWidth;
  height = canvas.clientHeight;
  const scale = window.devicePixelRatio || 1;
  canvas.width = width * scale;
  canvas.height = height * scale;
  ctx.setTransform(scale,0,0,scale,0,0);
  unit = Math.max(10, Math.min(16, width / 56));
  ctx.font = '700 ' + unit + 'px Consolas, monospace';
  cell = ctx.measureText('(').width;
  buildScenery();
}

function buildScenery() {
  const placed = [];
  for (const [index,item] of layout.entries()) {
    const piece = makeScenery(item,index);
    if (piece.kind) {
      for (let attempt=0;!fitPersonalItem(piece,placed) && attempt<8;attempt++) {
        piece.size *= .78;
        piece.span *= .78;
        piece.charWidth *= .78;
        placeDecoration(piece,item.at*width,item.level*height);
      }
    }
    placed.push(piece);
  }
  scenery = placed.sort((a,b)=>Number(Boolean(a.plant))-Number(Boolean(b.plant)));
}

const personalGap = 2;

function personalOverlap(piece,peers) {
  if (!piece.kind || piece.kind === 'words') return false;
  const box = resizeBounds(piece);
  return peers.some(other=>{
    if (!other.kind || other.kind === 'words' || other.item === piece.item) return false;
    const edge = resizeBounds(other);
    const gap = personalGap-.001;
    return box.right+gap>edge.left && box.left<edge.right+gap &&
      box.bottom+gap>edge.top && box.top<edge.bottom+gap;
  });
}

function personalOverlapArea(piece) {
  if (piece.kind === 'words') return 0;
  const box = resizeBounds(piece);
  let area = 0;
  for (const other of scenery) {
    if (!other.kind || other.kind === 'words' || other.item === piece.item) continue;
    const edge = resizeBounds(other);
    const overlapX = Math.min(box.right,edge.right)-Math.max(box.left,edge.left)+personalGap-.001;
    const overlapY = Math.min(box.bottom,edge.bottom)-Math.max(box.top,edge.top)+personalGap-.001;
    area += Math.max(0,overlapX)*Math.max(0,overlapY);
  }
  return area;
}

function fitPersonalItem(piece,peers) {
  if (!personalOverlap(piece,peers)) return true;
  const center = piece.x+piece.span*.5, base = piece.base;
  const initial = resizeBounds(piece);
  const half = (initial.right-initial.left)*.5;
  const above = base-initial.top;
  const others = peers.filter(other=>other.kind).map(resizeBounds);
  const xs = [center,...others.flatMap(box=>[box.left-half-personalGap,box.right+half+personalGap])];
  const ys = [base,...others.flatMap(box=>[box.top-6-personalGap,box.bottom+above+personalGap])];
  let best = null, nearest = Infinity;
  for (const x of xs) {
    for (const y of ys) {
      placeDecoration(piece,x,y);
      const distance = Math.hypot(piece.x+piece.span*.5-center,piece.base-base);
      if (distance>=nearest || personalOverlap(piece,peers)) continue;
      best = {x:piece.x,base:piece.base};
      nearest = distance;
    }
  }
  if (!best) {
    placeDecoration(piece,center,base);
    return false;
  }
  Object.assign(piece,best);
  return true;
}

function makeScenery(item,i) {
  const asset = decorations[item.type];
  const sizeFactor = appearanceSize(item)/100;
  const piece = {...asset,item,phase:i,color:appearanceColor(item,asset),
    rowPitch:asset.kind === 'photo' ? photoRowPitch : .87*(asset.grass ? item.heightScale ?? 1 : 1),
    size:unit*(asset.plant ? (i%2 ? .93 : 1.28) : .96)};
  if (asset.kind === 'timer') piece.size *= .67;
  if (asset.kind === 'words') piece.rows = [String(item.text || 'ASCII').slice(0,28)];
  if (asset.kind === 'turntable') {
    const rows = Math.round((deckColumns*cell/unit-.9)/.87)+1;
    piece.rows = Array(rows).fill(' '.repeat(deckColumns));
    piece.size *= .66;
  }
  if (asset.kind === 'photo' && Array.isArray(item.ascii) && item.ascii.length) {
    piece.rows = photoFrame(item.ascii);
    piece.photoRuns = piece.rows.slice(1,-1).map((line,row)=>
      photoRuns(line.slice(1,-1),Array.isArray(item.asciiColors) ? item.asciiColors[row] : null));
    if (!item.chunky && (item.ascii[0].length>24 || item.ascii.length>20)) {
      piece.size *= .66*Math.min(1,48/Math.max(item.ascii[0].length,item.ascii.length*.7));
    }
  }
  const columns = Math.max(...piece.rows.map(line=>line.length));
  const cellWidth = cell*(asset.kind === 'photo' ? photoWidthScale : 1);
  if (piece.resizable) {
    const widthLimit = Math.max(1,width-18)*unit/(columns*cellWidth);
    const heightLimit = (gravelContact(width*.5)-height*.14-12)/((piece.rows.length-1)*piece.rowPitch+.9);
    piece.size = Math.min(piece.size,Math.min(widthLimit,heightLimit)/1.75)*sizeFactor;
  } else {
    piece.size = Math.min(piece.size*sizeFactor,width*.95*unit/(columns*cell));
  }
  const charWidth = cellWidth*piece.size/unit;
  ctx.font = '700 ' + piece.size + 'px Consolas, monospace';
  const span = asset.kind === 'words' ? ctx.measureText(piece.rows[0]).width :
    columns*charWidth;
  const ascents = new Map();
  if (!piece.kind) {
    for (const glyph of new Set(piece.rows.join(''))) {
      if (glyph !== ' ') ascents.set(glyph,ctx.measureText(glyph).actualBoundingBoxAscent ?? piece.size*.55);
    }
  }
  const placed = {...piece,span,charWidth,ascents};
  placeDecoration(placed,item.at*width,item.level*height);
  return placed;
}

function placeDecoration(piece,x,y) {
  const inset = piece.resizable ? 9 : 0;
  piece.x = Math.max(inset,Math.min(width-piece.span-inset,x-piece.span*.5));
  const top = piece.resizable ? height*.14+12+((piece.rows.length-1)*piece.rowPitch+.9)*piece.size :
    height*.15+piece.rows.length*piece.size;
  piece.base = Math.max(top,Math.min(gravelContact(piece.x+piece.span*.5),y));
}

function moveStack(piece,x,y) {
  const group = new Set([piece]);
  if (piece.kind && piece.kind !== 'words') {
    for (const support of group) {
      const base = resizeBounds(support);
      for (const other of scenery) {
        if (!other.kind || other.kind === 'words' || group.has(other)) continue;
        const box = resizeBounds(other);
        if (box.right>base.left && box.left<base.right &&
            Math.abs(box.bottom+personalGap-base.top)<3) group.add(other);
      }
    }
  }
  if (group.size === 1) {
    moveDecoration(piece,x,y);
    return;
  }
  const dx = x-piece.x-piece.span*.5, dy = y-piece.base;
  const steps = Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/6));
  const peers = scenery.filter(other=>!group.has(other));
  for (let step=0;step<steps;step++) {
    for (const axis of ['x','base']) {
      const delta = (axis === 'x' ? dx : dy)/steps;
      for (const member of group) member[axis] += delta;
      const blocked = [...group].some(member=>{
        const box = resizeBounds(member);
        return box.left<4 || box.right>width-4 || box.top<height*.14+8 ||
          member.base>gravelContact(member.x+member.span*.5) ||
          personalOverlap(member,peers);
      });
      if (blocked) for (const member of group) member[axis] -= delta;
    }
  }
  for (const member of group) storePosition(member);
}

function moveDecoration(piece,x,y) {
  const startX = piece.x, startY = piece.base;
  placeDecoration(piece,x,y);
  if (piece.kind) {
    const dx = piece.x-startX, dy = piece.base-startY;
    const steps = Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/6));
    piece.x = startX;
    piece.base = startY;
    let overlap = personalOverlapArea(piece);
    for (let step=0;step<steps;step++) {
      const previousX = piece.x, previousY = piece.base;
      piece.x += dx/steps;
      const horizontalOverlap = personalOverlapArea(piece);
      if (horizontalOverlap > overlap) piece.x = previousX;
      else overlap = horizontalOverlap;
      piece.base += dy/steps;
      const verticalOverlap = personalOverlapArea(piece);
      if (verticalOverlap > overlap) piece.base = previousY;
      else overlap = verticalOverlap;
    }
    piece.base = Math.min(piece.base,gravelContact(piece.x+piece.span*.5));
  }
  storePosition(piece);
}

function storePosition(piece) {
  piece.fallSpeed = 0;
  piece.item.at = (piece.x+piece.span*.5)/width;
  piece.item.level = piece.base >= gravelContact(piece.x+piece.span*.5)-1 ? 1 : piece.base/height;
}

function personalSupport(piece,bed) {
  if (!piece.kind || piece.kind === 'words') return bed;
  const box = resizeBounds(piece);
  let floor = bed;
  for (const other of scenery) {
    if (!other.kind || other.kind === 'words' || other.item === piece.item) continue;
    const edge = resizeBounds(other);
    const gap = personalGap-.001;
    if (box.right+gap<=edge.left || box.left>=edge.right+gap) continue;
    const support = edge.top-6-personalGap;
    if (edge.bottom > box.bottom) floor = Math.min(floor,support);
  }
  return floor;
}

function settleDecorations(elapsed) {
  const held = drag?.item;
  let landed = false;
  for (const piece of [...scenery].sort((a,b)=>b.base-a.base)) {
    if ((piece.floating && !piece.dropping) || piece.item === held) continue;
    const bed = gravelContact(piece.x+piece.span*.5);
    const floor = Math.min(personalSupport(piece,bed),piece.dropTarget ?? bed);
    if (piece.base > floor && personalOverlap(piece,scenery) && floor >= height*.14+8+piece.base-resizeBounds(piece).top) {
      piece.base = floor;
      landed = true;
    }
    if (piece.base < floor) {
      piece.fallSpeed = Math.min(height*.55,(piece.fallSpeed ?? 0)+height*1.2*elapsed);
      piece.base = Math.min(floor,piece.base+piece.fallSpeed*elapsed);
      if (piece.base < floor) piece.item.level = piece.base/height;
    }
    if (piece.base === floor && (piece.fallSpeed || piece.item.level !== (floor===bed ? 1 : floor/height))) {
      piece.fallSpeed = 0;
      piece.item.level = floor===bed ? 1 : floor/height;
      landed = true;
    }
    if (piece.base === floor) piece.dropping = false;
    if (piece.base === floor && dropResetTimers.delete(piece.item)) resetTimer(piece.item);
  }
  if (landed) saveLayout();
}
new ResizeObserver(resize).observe(canvas);
resize();
for (const item of layout) {
  if (decorations[item.type].kind !== 'photo' || item.ascii ||
      !/^data:image\/jpeg;base64,/.test(item.image ?? '')) continue;
  convertPhoto(item.image).then(photo=>{
    if (!layout.includes(item)) return;
    item.ascii = photo.rows;
    item.asciiColors = photo.colors;
    item.chunky = true;
    delete item.image;
    buildScenery();
    saveLayout();
  }).catch(()=>{ /* Leave the empty frame if the old image cannot be decoded. */ });
}

function ink(line,x,y,color,size=unit,glow=0) {
  ctx.font = '700 ' + size + 'px Consolas, monospace';
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;
  ctx.fillText(line,x,y);
}

function drawFrame(piece) {
  const {left,right,top,bottom} = resizeBounds(piece);
  const w = right-left, h = bottom-top;
  ctx.save();
  ctx.fillStyle = '#101013';
  ctx.shadowBlur = 0;
  ctx.fillRect(left,top,w,h);
  ctx.restore();
}

function recordTile(piece,radiusX,radiusY) {
  const resolution = window.devicePixelRatio || 1;
  if (piece.recordTile?.art === recordArtwork && piece.recordTile.resolution === resolution) {
    return piece.recordTile;
  }
  const w = radiusX*piece.charWidth*2, h = radiusY*piece.size*.87*2;
  const tile = document.createElement('canvas');
  tile.width = Math.ceil(w*resolution);
  tile.height = Math.ceil(h*resolution);
  const paint = tile.getContext('2d');
  paint.scale(resolution,resolution);
  paint.font = '700 '+piece.size*.59+'px Consolas, monospace';
  paint.textAlign = 'center';
  paint.textBaseline = 'middle';
  recordArtwork.rows.forEach((line,row)=>{
    const y = row/(recordArtwork.rows.length-1);
    for (let col=0;col<line.length;col++) {
      const x = col/(line.length-1);
      if (line[col] === ' ' || Math.hypot(x-.5,y-.5)>.465) continue;
      paint.fillStyle = '#'+recordArtwork.colors[row].slice(col*6,col*6+6);
      paint.fillText(line[col],x*w,y*h);
    }
  });
  piece.recordTile = {tile,art:recordArtwork,resolution,w,h};
  return piece.recordTile;
}

function drawTurntable(piece) {
  const {left,right,top,bottom} = resizeBounds(piece);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#111414';
  ctx.fillRect(left,top,right-left,bottom-top);
  const chars = ' .:;oO';
  const recordBottom = piece.rows.length-4;
  const centerX = 19, centerY = (recordBottom+1)/2;
  const radiusX = Math.min(16.5,(recordBottom-1)*.5*piece.size*.87/piece.charWidth);
  const radiusY = radiusX*piece.charWidth/(piece.size*.87);
  const pivot = Math.round(centerY)-7;
  const origin = sceneryRow(piece,0);
  const spindleX = origin.x+(centerX+.5)*piece.charWidth;
  const spindleY = origin.y+centerY*piece.size*.87;
  const arm = track.status === 'playing'
    ? [[1,36,'II'],[2,35,'II'],[3,35,'II'],[4,34,'II'],[5,33,'II'],[6,32,'II'],
      [7,31,'HH'],[8,29,'[=]'],[9,30,'v']]
    : [[1,35.5,'II'],[2,35.5,'II'],[3,35.5,'II'],[4,35.5,'II'],[5,35.5,'II'],[6,35.5,'II'],
      [7,35.5,'HH'],[8,34.5,'[==]'],[9,36,'v']];
  const deckText = (row,text,color,offset=0,size=piece.size)=>{
    const {x,y} = sceneryRow(piece,row);
    ink(text,x+offset*piece.charWidth,y,color,size);
  };
  const rule = '+'+'-'.repeat(deckColumns-2)+'+';
  deckText(0,rule,piece.color);
  for (let row=1;row<=recordBottom;row++) {
    let platter = '|';
    const print = [];
    for (let col=1;col<deckColumns-1;col++) {
      const x = (col-centerX)/radiusX, y = (row-centerY)/radiusY;
      const radius = Math.hypot(x,y);
      let glyph = ' ';
      if (!recordArtwork && radius<.32) {
        print.push([col,radius>.28 ? 'o' : ':','#e58d70']);
      } else if (radius<1 && (!recordArtwork || radius>.93)) {
        const light = Math.cos(Math.atan2(y,x)*2-(recordArtwork ? 0 : recordAngle))*.9+.9;
        const groove = Math.floor(radius*30)%3 === 0 ? 1 : 0;
        glyph = radius>.92 ? 'o' : chars[1+groove+Math.floor(light)];
      }
      platter += glyph;
    }
    deckText(row,platter+'|',piece.color);
    for (const [col,glyph,color] of print) deckText(row,glyph,color,col);
  }
  if (recordArtwork) {
    const {tile,w,h} = recordTile(piece,radiusX,radiusY);
    ctx.save();
    ctx.translate(spindleX,spindleY);
    ctx.scale(w,h);
    ctx.rotate(recordAngle);
    ctx.drawImage(tile,-.5,-.5,1,1);
    ctx.restore();
  }
  ctx.shadowBlur = 0;
  const cutout = Math.max(2,piece.size*.30);
  const hubRadius = Math.min(radiusX*piece.charWidth,radiusY*piece.size*.87)*.23;
  ctx.fillStyle = 'rgba(0,0,0,.43)';
  ctx.beginPath();
  ctx.arc(spindleX,spindleY,hubRadius,0,Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#050505';
  ctx.beginPath();
  ctx.arc(spindleX,spindleY,cutout,0,Math.PI*2);
  ctx.fill();
  deckText(pivot,'(o)','#f5f5f5',34.25,piece.size*1.5);
  for (const [row,col,body] of arm) deckText(pivot+row,body,'#f5f5f5',col);
  const clean = text=>text.normalize('NFKD').replace(/\p{M}/gu,'')
    .replace(/đ/g,'d').replace(/Đ/g,'D').replace(/[^\x20-\x7e]/g,'?');
  const banner = (row,text)=>{
    const available = deckColumns-4;
    const safe = clean(text);
    const clipped = safe.length>available ? safe.slice(0,available-3)+'...' : safe;
    deckText(row,'| '+clipped.padEnd(available)+' |',piece.color);
  };
  const state = {playing:'PLAYING',paused:'PAUSED',idle:'NOT PLAYING',unavailable:'MEDIA UNAVAILABLE'}[track.status];
  banner(recordBottom+1,[state,track.title].filter(Boolean).join('  '));
  banner(recordBottom+2,track.artist ?? '');
  deckText(recordBottom+3,rule,piece.color);
}

function ground(x) {
  return height-Math.min(74,height*.13)+Math.sin(x/38)*4+Math.sin(x/89)*3;
}
function gravelContact(x) {
  return ground(x)+.5*gravelRowHeight;
}

function sceneryRow(piece,row) {
  const above = piece.rows.length-1-row;
  const swayStrength = piece.plant ? .7 : piece.coral ? .35 : 0;
  const sway = Math.sin(time*1.6+piece.phase-row*.25)*above*swayStrength;
  return {x:piece.x+sway,y:piece.base-above*piece.size*piece.rowPitch};
}

function pelletFloor(x,previousY) {
  let floor = gravelContact(x)-unit*.1;
  for (const piece of scenery) {
    if (x<piece.x-5 || x>piece.x+piece.span+5) continue;
    if (piece.kind) {
      const box = resizeBounds(piece);
      const top = box.top+4;
      if (x>=box.left && x<=box.right && top>=previousY-unit*.12) floor = Math.min(floor,top);
      continue;
    }
    for (let row=0;row<piece.rows.length;row++) {
      const origin = sceneryRow(piece,row);
      const col = Math.floor((x-origin.x)/piece.charWidth);
      const glyph = piece.rows[row][col];
      const top = origin.y-(piece.ascents.get(glyph) ?? 0);
      if (glyph && glyph !== ' ' && top >= previousY-piece.size*.12) {
        floor = Math.min(floor,top);
        break;
      }
    }
  }
  return floor/height;
}

function obstacleBounds(piece,padding) {
  return {piece,left:(piece.x-padding)/width,right:(piece.x+piece.span+padding)/width,
    top:(sceneryRow(piece,0).y-unit*.40)/height,bottom:(piece.base+unit*.33)/height};
}

function fishObstacle(x,y,padding) {
  for (const piece of scenery) {
    if (piece.plant || piece.coral || piece.kind || x < piece.x-padding || x > piece.x+piece.span+padding) continue;
    const bounds = obstacleBounds(piece,padding);
    if (y>bounds.top && y<bounds.bottom) return bounds;
  }
  return null;
}

function firstBarrier(f,aim,padding) {
  let closest = 2, barrier = null;
  const dx = aim.x-f.x, dy = aim.y-f.y;
  for (const piece of scenery) {
    if (piece.plant || piece.coral || piece.kind) continue;
    const bounds = obstacleBounds(piece,padding);
    if (Math.max(f.x,aim.x)<bounds.left || Math.min(f.x,aim.x)>bounds.right) continue;
    const a = dx ? (bounds.left-f.x)/dx : 0;
    const b = dx ? (bounds.right-f.x)/dx : 1;
    const enter = Math.max(0,Math.min(a,b)), exit = Math.min(1,Math.max(a,b));
    const y1 = f.y+enter*dy, y2 = f.y+exit*dy;
    if (enter<closest && Math.max(y1,y2)>bounds.top && Math.min(y1,y2)<bounds.bottom) {
      closest = enter;
      barrier = bounds;
    }
  }
  return barrier;
}

function steerAround(f,aim,padding,margin) {
  const floor = x=>(gravelContact(x*width)-unit*.17)/height;
  const target = {x:Math.max(margin,Math.min(1-margin,aim.x)),y:aim.y};
  target.y = Math.max(.075,Math.min(floor(target.x),target.y));
  const clearance = unit*.8/height;
  const occupied = fishObstacle(target.x*width,target.y,padding);
  if (occupied) target.y = Math.max(.075,occupied.top-clearance);
  const barrier = firstBarrier(f,target,padding);
  if (!barrier) {
    f.detour = null;
    return target;
  }

  const left = Math.max(margin,barrier.left-unit/width);
  const right = Math.min(1-margin,barrier.right+unit/width);
  const above = Math.max(.075,barrier.top-clearance);
  const below = barrier.bottom+clearance;
  const canGoBelow = below<Math.min(floor(left),floor(right));
  if (f.detour?.piece !== barrier.piece || (f.detour.below && !canGoBelow)) {
    f.detour = {piece:barrier.piece,below:canGoBelow &&
      Math.abs(f.y-below)+Math.abs(target.y-below) < Math.abs(f.y-above)+Math.abs(target.y-above)};
  }
  const y = f.detour.below ? below : above;
  const clear = f.detour.below ? f.y>=barrier.bottom+clearance*.6 : f.y<=barrier.top-clearance*.6;
  const leftward = target.x<f.x;
  if (clear) return {x:leftward ? left : right,y};
  return {x:leftward ? Math.max(f.x,right) : Math.min(f.x,left),y};
}

function dodge(obstacle,fromY,floor) {
  if (obstacle.bottom < floor && fromY > (obstacle.top+obstacle.bottom)*.5) {
    return obstacle.bottom;
  }
  return obstacle.top;
}

function movePellet(pellet,elapsed) {
  if (pellet.starts > time) return;
  if (!pellet.resting) {
    pellet.x += (pellet.drift+Math.sin(time*3+pellet.phase)*.018)*elapsed;
    if (pellet.x < .012 || pellet.x > .988) {
      pellet.x = Math.max(.012,Math.min(.988,pellet.x));
      pellet.drift = Math.abs(pellet.drift)*(pellet.x < .5 ? 1 : -1);
    }
    const depth = Math.max(0,Math.min(1,(pellet.y-.055)/.8));
    const settlingSpeed = .12-.095*depth;
    pellet.fall += (settlingSpeed-pellet.fall)*(1-Math.exp(-elapsed*4));
    pellet.drift *= Math.exp(-elapsed*.55);
  }
  const floor = pelletFloor(pellet.x*width,pellet.y*height);
  const nextY = pellet.y+pellet.fall*elapsed;
  pellet.resting = nextY >= floor;
  pellet.y = Math.min(floor,nextY);
  if (pellet.resting) {
    pellet.fall = .045;
    pellet.drift = 0;
  }
}

function serveFood(entry=.44+Math.random()*.12) {
  const meal = {started:time,remaining:Math.max(14,fish.length*2), bites:new Map()};
  for (let i=0;i<meal.remaining;i++) {
    pellets.push({
      ...food[i%food.length], meal, x:entry, y:.055,
      drift:(i%2 ? 1 : -1)*(.023+Math.random()*.052), fall:.035+Math.random()*.04,
      phase:Math.random()*Math.PI*2, starts:time+i*.14, ends:time+i*.14+26
    });
  }
}

const bellyDuration = 9;

function currentShape(f) {
  const fullness = f.fullness;
  const scales = Array.from(f.body,(_,i)=>{
    const along = i/(f.body.length-1);
    const taper = Math.sin(Math.PI*along);
    const base = {pear:.1,puffer:.27,carp:.16,oval:.06}[f.profile] ?? 0;
    const roundness = f.profile === 'oval' ? Math.sqrt(taper) : taper;
    const pear = f.profile === 'pear' ? .7+.6*along : 1;
    return 1+base*roundness+fullness*Math.min(1,f.body.length/6)*(.22+.78*roundness)*pear;
  });
  const widths = scales.map(scale=>1+(scale-1)*(f.profile === 'puffer' ? .8 : .6));
  const bodyWidth = cell*widths.reduce((sum,scale)=>sum+scale,0);
  return {scales,widths,bodyWidth,span:bodyWidth+(f.head.length+f.tail.length)*cell};
}

function finishMeal(meal) {
  let winner = null;
  let biggest = 1;
  for (const [f,bites] of meal.bites) {
    if (bites > biggest) {
      biggest = bites;
      winner = f;
    } else if (bites === biggest) {
      winner = null;
    }
  }
  if (winner) {
    const remaining = winner.belly*Math.max(0,(winner.fullUntil-time)/bellyDuration);
    winner.belly = Math.min(1.85,Math.max(remaining,.65+biggest*.22));
    winner.fullUntil = time+bellyDuration;
  }
}

function bite(f,pellet) {
  pellet.ends = time;
  const bites = pellet.meal.bites;
  bites.set(f,(bites.get(f) ?? 0)+1);
  if (f.target === pellet) f.target = null;
  f.passBites++;
  f.biteUntil = time+.24;
}

function endPass(f) {
  f.passUntil = 0;
  f.coastUntil = time+passCooldown;
}

function sweepFood(f,fromX,fromY,toX,toY) {
  const dx = toX-fromX, dy = toY-fromY;
  const distanceSquared = dx*dx+dy*dy;
  for (const pellet of pellets) {
    if (f.passBites >= passLimit) break;
    if (pellet.starts > time || pellet.ends <= time) continue;
    const px = pellet.x*width-fromX, py = pellet.y*height-fromY;
    const along = distanceSquared ? Math.max(0,Math.min(1,(px*dx+py*dy)/distanceSquared)) : 0;
    if (Math.hypot(px-dx*along,py-dy*along) < unit*1.4) bite(f,pellet);
  }
  if (f.passBites >= passLimit) endPass(f);
}

function moveFish(f, elapsed) {
  const aspect = width/height;
  const mouthOffset = (currentShape(f).span-cell)*.5/width;
  const padding = mouthOffset*width*.25;
  const margin = mouthOffset+unit*.7/width;
  const distance = (x,y) => Math.hypot((x-f.x)*aspect,y-f.y);
  const startX = f.x, startY = f.y;
  if (f.target?.ends <= time) f.target = null;
  if (f.target && time-f.targetAt>6) {
    f.target.claimed = false;
    f.skipped = f.target;
    f.target = null;
  }
  if (f.passUntil && time >= f.passUntil) endPass(f);
  const passing = f.passUntil > time;
  const coasting = time < f.coastUntil;
  if (!f.target && !coasting && !passing) {
    let closest = Infinity;
    for (const pellet of pellets) {
      if (pellet.claimed || pellet.starts > time || pellet.ends<=time || pellet===f.skipped) continue;
      const gap = distance(pellet.x,pellet.y);
      if (gap >= closest) continue;
      closest = gap;
      f.target = pellet;
    }
    if (f.target) {
      f.target.claimed = true;
      f.targetAt = time;
      f.approach = f.target.x >= f.x ? 1 : -1;
    }
  }

  if (!coasting && !passing) {
    let aim = f.destination;
    if (f.target) {
      const pellet = f.target;
      aim = {
        x:pellet.x-f.approach*mouthOffset+pellet.drift*.25,
        y:pellet.y+(pellet.resting ? 0 : pellet.fall*.3)
      };
      if (distance(aim.x,aim.y) < .09) f.dir = f.approach;
    } else if (!aim || distance(aim.x,aim.y) < .09 || fishObstacle(aim.x*width,aim.y,padding)) {
      aim = f.destination = {x:.13+Math.random()*.74, y:.17+Math.random()*.79};
    }
    const waypoint = steerAround(f,aim,padding,margin);
    const gap = distance(waypoint.x,waypoint.y);
    const feedingDepth = f.target ? (f.target.y-.12)/.65 : 0;
    const feedingRamp = Math.max(0,Math.min(1,feedingDepth));
    const speed = (f.target ? .13+.5*feedingRamp : .115)*f.pace;
    const ease = 1-Math.exp(-elapsed*(f.detour ? 8 : f.target ? 5 : 2));
    const step = speed/Math.max(.03,gap);
    f.dx += ((waypoint.x-f.x)*step-f.dx)*ease;
    f.dy += ((waypoint.y-f.y)*step-f.dy)*ease;
  }

  const nextX = Math.max(margin,Math.min(1-margin,f.x+f.dx*elapsed));
  if (fishObstacle(nextX*width,f.y,padding)) f.dx = 0;
  else f.x = nextX;
  const floor = (gravelContact(f.x*width)-unit*.17)/height;
  const nextY = Math.max(.075,Math.min(floor,f.y+f.dy*elapsed));
  const obstacle = fishObstacle(f.x*width,nextY,padding);
  f.y = obstacle ? dodge(obstacle,f.y,floor) : nextY;
  if (obstacle || f.y === floor) f.dy = 0;
  if (!f.target || distance(f.target.x,f.target.y) > .18) {
    if (Math.abs(f.dx)*aspect > .035) f.dir = Math.sign(f.dx);
  }
  const target = f.target;
  if (target) {
    const mouth = f.x+f.dir*mouthOffset;
    if (Math.hypot((target.x-mouth)*width,(target.y-f.y)*height) < unit*1.4) {
      f.passBites = 0;
      f.passUntil = time+.78;
      bite(f,target);
      if (Math.hypot(f.dx*aspect,f.dy)<.19) f.dx = f.dir*.25/aspect;
    }
  }
  if (f.passUntil > time) {
    sweepFood(f,(startX+f.dir*mouthOffset)*width,startY*height,
      (f.x+f.dir*mouthOffset)*width,f.y*height);
  }
}

let plantBubbles = [];

function draw(now) {
  const elapsed = paused ? 0 : Math.min((now-previous)/1000,.05);
  previous = now;
  if (!paused) {
    time += elapsed;
    if (track.status === 'playing') recordAngle = (recordAngle+elapsed*1.15)%(Math.PI*2);
    settleDecorations(elapsed);
    for (const pellet of pellets) movePellet(pellet,elapsed);
    for (const f of fish) {
      const target = f.belly*Math.max(0,Math.min(1,(f.fullUntil-time)/(bellyDuration-2)));
      f.fullness += (target-f.fullness)*(1-Math.exp(-elapsed*5));
      moveFish(f,elapsed);
    }
    for (const piece of scenery) {
      if (!piece.plant) continue;
      if (piece.nextBubble === undefined) piece.nextBubble = time+2+Math.random()*7;
      if (time >= piece.nextBubble) {
        const tip = sceneryRow(piece,1);
        for (let i=0;i<10;i++) plantBubbles.push({
          x:tip.x+piece.span*.5,y:tip.y,starts:time+i*.3,gray:Math.floor(Math.random()*5),phase:Math.random()*6
        });
        piece.nextBubble = time+5+Math.random()*9;
      }
    }
    for (const bubble of plantBubbles) {
      if (time>=bubble.starts) bubble.y -= elapsed*height*.065;
    }
    plantBubbles = plantBubbles.filter(bubble=>bubble.y>25);
    pellets = pellets.filter(pellet => {
      if (pellet.ends > time) return true;
      if (--pellet.meal.remaining === 0) finishMeal(pellet.meal);
      return false;
    });
  }
  ctx.clearRect(0,0,width,height);
  for (let row=0; row<4; row++) {
    for (let x=-30+row*9; x<width+40; x+=33) {
      const y = 14+row*11+Math.sin(x/48+time/2+row)*5;
      ink(row%2 ? '. ~' : '~ ~',x,y,['#edededad','#c9c9c987','#a1a1a167','#86868655'][row],15-row);
    }
  }
  for (let i=0;i<76;i++) {
    const x = ((i*137.29+Math.sin(i+time/4)*10)%width+width)%width;
    const y = ((i*57-time*(3+i%11))%(height-42)+height-42)%(height-42)+26;
    ink(['.','o',':','+'][i%4],x,y,i%6 ? '#a1a1a146' : '#dadada88',8+i%8);
  }
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#191919';
  ctx.beginPath();
  ctx.moveTo(0,height);
  for (let x=0;x<=width+12;x+=12) ctx.lineTo(x,ground(x));
  ctx.lineTo(width,height);
  ctx.fill();
  const gravel = ['o..::','.,:#.','-:o..','..#:.'];
  for (let x=0;x<width;x+=23) {
    const top = ground(x);
    ink(['_ .','.._',': :'][Math.floor(x/23)%3],x,top+2,'#a1a1a1',12);
    for (let row=1; top+row*gravelRowHeight<height+3; row++) {
      const pattern = gravel[(Math.floor(x/23)+row)%gravel.length];
      ink(pattern,x+row%2*5,top+row*gravelRowHeight,row<3 ? '#6a6a6a' : '#494949',9);
    }
  }
  const wallTime = new Date();
  const timerReadouts = [];
  for (const piece of scenery) {
    if (piece.kind === 'turntable') {
      drawTurntable(piece);
      continue;
    }
    if (piece.kind === 'timer') {
      const seconds = Math.max(0,Math.ceil(((piece.item.endsAt || 0)-wallTime.getTime())/1000));
      globeRows(seconds,timerDuration(piece.item),time+piece.phase).forEach((line,row)=>{
        const {x,y} = sceneryRow(piece,row);
        ink(row===globeReadoutRow ? line.replace(timerText(seconds),'     ') : line,x,y,piece.color,piece.size);
        if (row===globeReadoutRow) timerReadouts.push({piece,x,y,text:timerText(seconds)});
      });
      continue;
    }
    if (piece.kind === 'photo') drawFrame(piece);
    piece.rows.forEach((line,row)=>{
      const {x,y} = sceneryRow(piece,row);
      const color = piece.tips && row < 2 ? piece.tips : piece.color;
      if (row === 1 && piece.kind === 'clock') line = '| '+clockText(wallTime)+' |';
      if (piece.kind === 'photo') {
        ctx.save();
        ctx.translate(x,0);
        ctx.scale(photoWidthScale,1);
        if (row === 0 || row === piece.rows.length-1) {
          const grain = (row === 0 ? '=-' : '-=').repeat(line.length);
          ink('+'+grain.slice(0,line.length-2)+'+',0,y,color,piece.size);
        } else {
          const edge = row%3 === 0 ? '#' : '|';
          const advance = piece.charWidth/photoWidthScale;
          ink(edge,0,y,color,piece.size);
          for (const run of piece.photoRuns?.[row-1] ?? []) {
            if (run.text.trim()) ink(run.text,(1+run.at)*advance,y,run.color,piece.size);
          }
          ink(edge,(line.length-1)*advance,y,color,piece.size);
        }
        ctx.restore();
      } else {
        ink(line,x,y,color,piece.size,piece.plant || piece.tips ? 7 : 2);
      }
    });
  }
  for (const f of fish) {
    const {scales,widths,bodyWidth,span} = currentShape(f);
    const head = time < f.biteUntil ? f.head.slice(0,-1)+'=' : f.head;
    const [left,right] = f.dir===1 ? [f.tail,head] : [mirror(head),mirror(f.tail)];
    const body = f.dir===1 ? f.body : mirror(f.body);
    const x = f.x*width-span*.5;
    const y = f.y*height;
    const bodyX = x+left.length*cell;
    if (f.name) {
      const nameSize = unit*.65;
      ctx.font = '700 '+nameSize+'px Consolas, monospace';
      ink(f.name,f.x*width-ctx.measureText(f.name).width*.5,
        y-unit*(1+Math.max(...scales)*.6),'#99999988',nameSize,0);
    }
    ink(left,x,y,f.color,unit,8);
    let glyphX = bodyX;
    for (let i=0;i<body.length;i++) {
      const index = f.dir === 1 ? i : body.length-1-i;
      const scale = scales[index];
      const stretch = widths[index];
      const bellyOffset = f.profile === 'pear' ? .48 : f.profile === 'carp' ? .15 : .27;
      ctx.save();
      ctx.translate(glyphX,0);
      ctx.scale(stretch/scale,1);
      ink(body[i],0,y+(scale-1)*unit*bellyOffset,f.color,unit*scale,8);
      ctx.restore();
      glyphX += cell*stretch;
    }
    ink(right,bodyX+bodyWidth,y,f.color,unit,8);
    if (f.fin) {
      const fin = f.dir===1 ? f.fin : mirror(f.fin);
      ink(fin,bodyX+(bodyWidth-fin.length*cell*.7)*.5,y-unit*(.7+(Math.max(...scales)-1)*.5),f.color,unit*.7,5);
    }
  }
  for (const bubble of plantBubbles) {
    if (time<bubble.starts) continue;
    const gray = ['#55555555','#77777766','#99999966','#b0b0b077','#d0d0d066'][bubble.gray];
    ink('o',bubble.x+Math.sin(time*2+bubble.phase)*4,bubble.y,gray,9,0);
  }
  for (const {piece,x,y,text} of timerReadouts) {
    const size = piece.size*1.65;
    ctx.font = '700 '+size+'px Consolas, monospace';
    const span = ctx.measureText(text).width;
    const left = x+(piece.span-span)*.5;
    const baseline = y+piece.size*.12;
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0a1419';
    ctx.fillRect(left-3,baseline-size*.76,span+6,size*.91);
    ink(text,left,baseline,piece.color,size,4);
  }
  if (selected && (editor.open ||
      (frame.classList.contains('is-fullscreen') && decorations[selected.type].resizable))) {
    const piece = scenery.find(piece=>piece.item === selected);
    ctx.strokeStyle = '#ddd';
    ctx.shadowBlur = 0;
    if (piece.resizable) {
      ctx.fillStyle = '#191919';
      for (const {x,y} of resizeHandles(piece)) {
        ctx.fillRect(x-4,y-4,8,8);
        ctx.strokeRect(x-4,y-4,8,8);
      }
    } else {
      const top = sceneryRow(piece,0).y-piece.size;
      ctx.setLineDash([4,4]);
      ctx.strokeRect(piece.x-3,top,piece.span+6,piece.base-top+5);
      ctx.setLineDash([]);
    }
  }
  for (const pellet of pellets) {
    if (pellet.starts <= time) ink(pellet.glyph,pellet.x*width-cell*.5,pellet.y*height,pellet.color,unit,10);
  }
  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);

let sendingFeed = false;
function lockFeeding(locked) {
  get('drop-zone').disabled = locked;
}

function render(state, entry) {
  const previousMeals = meals ?? (entry === undefined ? state.meals : state.meals-1);
  for (let count=previousMeals; count<state.meals; count++) {
    serveFood(count === state.meals-1 ? entry : undefined);
  }
  meals = state.meals;
  get('meals').textContent = meals;
  get('last').textContent = meals ? new Date(state.last).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}) : '—';
  get('status').hidden = true;
  lockFeeding(false);
}
async function refresh() {
  try {
    const response = await fetch('/api/tank');
    if (!response.ok) throw Error();
    const state = await response.json();
    if (!sendingFeed && state.meals >= (meals ?? 0)) render(state);
  } catch {
    get('status').textContent = 'Waiting for the local aquarium server…';
    get('status').hidden = false;
    lockFeeding(true);
  }
}
async function feedAt(entry) {
  if (sendingFeed || get('drop-zone').disabled) return;
  sendingFeed = true;
  lockFeeding(true);
  try {
    const response = await fetch('/api/feed',{method:'POST',headers:{'X-Aquarium':'feed'}});
    if (response.ok) {
      render(await response.json(),entry);
      return;
    }
  } catch {
    get('status').textContent = 'Waiting for the local aquarium server…';
    get('status').hidden = false;
  } finally {
    sendingFeed = false;
  }
  await refresh();
}
get('drop-zone').onclick = event => {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.detail ? (event.clientX-rect.left)/rect.width : .5;
  return feedAt(Math.max(.012,Math.min(.988,x)));
};
if (fullscreenFallback) updateFullscreen();
refresh();
setInterval(refresh,800);
refreshTrack();
setInterval(refreshTrack,1800);
checkTimers();
setInterval(checkTimers,250);

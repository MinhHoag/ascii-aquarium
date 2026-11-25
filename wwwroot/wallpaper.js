(() => {
  const byId = id => document.getElementById(id);
  const wallpaper = byId('tank-wallpaper');
  const clock = byId('wallpaper-clock');
  const message = byId('wallpaper-message');
  const caption = byId('wallpaper-caption');
  const fields = {
    mode:byId('wallpaper-mode'),
    message:byId('wallpaper-message-input'),
    caption:byId('wallpaper-caption-mode'),
    captionText:byId('wallpaper-caption-input'),
    size:byId('wallpaper-size'),
    opacity:byId('wallpaper-opacity')
  };
  if (window.aquariumStartsFullscreen) fields.mode.value = 'clock';
  const storageKey = 'ascii-aquarium-wallpaper';
  const defaults = Object.fromEntries(Object.entries(fields).map(([name,field])=>[name,field.value]));
  const footerDate = new Intl.DateTimeFormat(undefined,{weekday:'short',month:'short',day:'numeric'});
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    for (const [name,field] of Object.entries(fields)) {
      if (typeof saved?.[name] !== 'string') continue;
      field.value = saved[name];
      if (field.tagName === 'SELECT' && !field.value) field.value = defaults[name];
    }
  } catch {
    // The controls remain usable without browser storage.
  }

  function updateTime() {
    if (wallpaper.hidden) return;
    const now = new Date();
    if (!clock.hidden) {
      const time = [now.getHours(),now.getMinutes(),now.getSeconds()]
        .map(part=>String(part).padStart(2,'0')).join(':');
      clock.textContent = time;
      clock.dateTime = time;
    }
    if (fields.caption.value === 'date') {
      caption.textContent = footerDate.formatToParts(now).filter(part=>part.type !== 'literal')
        .map(part=>part.value).join(' ');
    }
  }

  function applySettings() {
    const mode = fields.mode.value;
    const line = fields.caption.value;
    const words = fields.message.value.trim();
    const footer = fields.captionText.value.trim();
    wallpaper.hidden = mode === 'off' || (mode === 'text' && !words && (line === 'none' || (line === 'text' && !footer)));
    clock.hidden = mode !== 'clock';
    message.hidden = mode !== 'text' || !words;
    message.textContent = words;
    caption.hidden = line === 'none' || (line === 'text' && !footer);
    if (line === 'text') caption.textContent = footer;
    byId('wallpaper-message-field').hidden = mode !== 'text';
    byId('wallpaper-caption-field').hidden = line !== 'text';
    wallpaper.style.setProperty('--wallpaper-scale',Number(fields.size.value)/100);
    wallpaper.style.setProperty('--wallpaper-opacity',Number(fields.opacity.value)/100);
    byId('wallpaper-size-value').value = fields.size.value+'%';
    byId('wallpaper-opacity-value').value = fields.opacity.value+'%';
    for (const slider of [fields.size,fields.opacity]) {
      const fill = (Number(slider.value)-Number(slider.min))/(Number(slider.max)-Number(slider.min));
      slider.style.setProperty('--range-fill',fill*100+'%');
    }
    updateTime();
  }
  byId('wallpaper-reset').onclick = ()=>{
    for (const [name,field] of Object.entries(fields)) field.value = defaults[name];
    applySettings();
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // The default values still apply to the current visit.
    }
  };

  for (const field of Object.values(fields)) {
    field.addEventListener('input',()=>{
      applySettings();
      try {
        localStorage.setItem(storageKey,JSON.stringify(Object.fromEntries(
          Object.entries(fields).map(([name,input])=>[name,input.value]))));
      } catch {
        // Settings still apply to the current visit.
      }
    });
  }
  applySettings();
  setInterval(updateTime,1000);
})();

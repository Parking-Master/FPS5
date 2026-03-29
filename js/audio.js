const AudioWrapper = function(src, alias = false) {
  const ctx = audio.ctx;
  const gain = ctx.createGain();
  gain.gain.value = 1;
  gain.connect(ctx.destination);
  let mainWrapper = null;
  let steps = 1;
  if (alias) steps = 2;
  for (let i = 0; i < steps; i++) {
    const wrapper = {
      buffer: null,
      source: null,
      sources: [],
      loop: false,
      startTime: 0,
      offset: 0,
      playing: false,
      loadPromise: fetch(src).then(res => res.arrayBuffer()).then(buf => ctx.decodeAudioData(buf)).then(decoded => wrapper.buffer = decoded),
      play: function() {
        if (!wrapper.buffer) {
          wrapper.loadPromise.then(() => wrapper.play());
          return;
        }
        if (wrapper.playing) return;
        const source = ctx.createBufferSource();
        source.buffer = wrapper.buffer;
        source.loop = wrapper.loop;
        source.connect(gain);
        source.start(0, wrapper.offset);
        wrapper.startTime = ctx.currentTime - wrapper.offset;
        wrapper.source = source;
        wrapper.sources.push(source);
        wrapper.playing = true;
        source.onended = () => {
          if (!source.loop) wrapper.playing = false;
        };
      },
      pause: function() {
        if (wrapper.source) {
          try { wrapper.source.stop(); } catch {}
          wrapper.offset = ctx.currentTime - wrapper.startTime;
          wrapper.playing = false;
          wrapper.source.disconnect();
          wrapper.source = null;
        }
        wrapper.sources.forEach(x => x.disconnect());
        wrapper.sources = [];
      },
      get currentTime() {
        return wrapper.playing ? ctx.currentTime - wrapper.startTime : wrapper.offset;
      },
      set currentTime(t) {
        wrapper.offset = t;
        if (wrapper.playing) {
          wrapper.pause();
          wrapper.play();
        }
      },
      gain: gain
    };
    if (i == 0) {
      mainWrapper = wrapper;
    } else {
      mainWrapper.alias = wrapper;
    }
  }
  return mainWrapper;
};

audio = {
  ctx: new (window.AudioContext || window.webkitAudioContext)(),
  reload: function(weapon, type = "normal") {
    const sound = audio.sounds[`reload.${weapon.name}.${type}`];
    sound.pause();
    sound.currentTime = 0;
    sound.play();
  },
  fire: function(weapon, roundsFired) {
    let sound = null;
    if (weapon.fireMode == "auto" && (roundsFired + 1) % 2 == 0) {
      sound = audio.sounds[`fire.${weapon.name}`].alias;
    } else {
      sound = audio.sounds[`fire.${weapon.name}`];
    }
    sound.pause();
    sound.currentTime = 0;
    sound.play();
  }
};

audio.sounds = {
  "reload.AK-74.normal": AudioWrapper("/sounds/weapons/reloading/AK-74.mp3"),
  "reload.AK-74.full": AudioWrapper("/sounds/weapons/reloading/AK-74.full.mp3"),
  "fire.AK-74": AudioWrapper("/sounds/weapons/shooting/AK-74.mp3", true),
  "reload.FN-502.normal": AudioWrapper("/sounds/weapons/reloading/FN-502.mp3"),
  "reload.FN-502.full": AudioWrapper("/sounds/weapons/reloading/FN-502.full.mp3"),
  "fire.FN-502": AudioWrapper("/sounds/weapons/shooting/FN-502.mp3"),
};

document.addEventListener("touchstart", () => {
  if (audio.ctx.state === "suspended") audio.ctx.resume();
}, { once: true });
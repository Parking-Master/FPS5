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

const AudioWrapper3d = function(src, alias = false) {
  let mainWrapper = {};
  new THREE.AudioLoader().load(src, buffer => {
    let steps = 1;
    if (alias) steps = 2;
    for (let i = 0; i < steps; i++) {
      const sound = new THREE.PositionalAudio(camera.audioListener);
      sound.setBuffer(buffer);
      scene.add(sound);
      if (i == 0) {
        mainWrapper.sound = sound;
      } else {
        mainWrapper.sound.alias = sound;

      }
    }
  });
  return mainWrapper;
}

let currentExplodeSound = 0;

audio = {
  ctx: new (window.AudioContext || window.webkitAudioContext)(),
  initialize: function() {
    const listener = new THREE.AudioListener();
    scene.add(listener);
    camera.audioListener = listener;
  },
  update: function() {
    if (typeof camera.audioListener != "undefined") {
      camera.audioListener.position.copy(camera.position);
      camera.audioListener.rotation.copy(camera.rotation);
    }
  },
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
  },
  grenadeHit: function(position) {
    if (Date.now() - grenade.lastHitTimestamp < 200) return;
    grenade.lastHitTimestamp = Date.now();
    const sound = audio.sounds["grenade.hit.0"].sound;
    sound.position.copy(position);
    if (sound.source) sound.stop();
    sound.play();
  },
  grenadeExplosion: function(position, type) {
    if (type == "mk2") {
      let sound = null;
      if ((currentExplodeSound + 1) % 2 == 0) {
        sound = audio.sounds["grenade.explosion.mk2"].sound.alias;
      } else {
        sound = audio.sounds["grenade.explosion.mk2"].sound;
      }
      currentExplodeSound++;
      sound.position.copy(position);
      sound.setVolume(7);
      if (sound.source) sound.stop();
      sound.play();
    } else if (type == "plasma") {
      const sound = audio.sounds[`grenade.explosion.plasma.${(currentExplodeSound + 1) % 2}`].sound;
      currentExplodeSound++;
      sound.position.copy(position);
      sound.setVolume(7);
      if (sound.source) sound.stop();
      sound.play();
    }
  },
};

audio.sounds = {
  "reload.AK-74.normal": AudioWrapper("/sounds/weapons/reloading/AK-74.mp3"),
  "reload.AK-74.full": AudioWrapper("/sounds/weapons/reloading/AK-74.full.mp3"),
  "fire.AK-74": AudioWrapper("/sounds/weapons/shooting/AK-74.mp3", true),
  "reload.FN-502.normal": AudioWrapper("/sounds/weapons/reloading/FN-502.mp3"),
  "reload.FN-502.full": AudioWrapper("/sounds/weapons/reloading/FN-502.full.mp3"),
  "fire.FN-502": AudioWrapper("/sounds/weapons/shooting/FN-502.mp3"),
  "reload.SCAR-H.normal": AudioWrapper("/sounds/weapons/reloading/SCAR-H.mp3"),
  "reload.SCAR-H.full": AudioWrapper("/sounds/weapons/reloading/SCAR-H.full.mp3"),
  "fire.SCAR-H": AudioWrapper("/sounds/weapons/shooting/SCAR-H.mp3", true),
  "reload.30-SST.normal": AudioWrapper("/sounds/weapons/reloading/30-SST.mp3"),
  "reload.30-SST.full": AudioWrapper("/sounds/weapons/reloading/30-SST.full.mp3"),
  "fire.30-SST": AudioWrapper("/sounds/weapons/shooting/30-SST.mp3", true),
  "grenade.hit.0": AudioWrapper3d("/sounds/grenades/hits/0.mp3"),
  "grenade.explosion.mk2": AudioWrapper3d("/sounds/grenades/explosions/0.mp3", true),
  "grenade.explosion.plasma.0": AudioWrapper3d("/sounds/grenades/explosions/1.mp3"),
  "grenade.explosion.plasma.1": AudioWrapper3d("/sounds/grenades/explosions/2.mp3")
};

document.addEventListener("touchstart", () => {
  if (audio.ctx.state === "suspended") audio.ctx.resume();
}, { once: true });
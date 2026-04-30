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
  update: function(cameraPosition, cameraRotation) {
    if (typeof camera.audioListener != "undefined") {
      camera.audioListener.position.copy(cameraPosition);
      camera.audioListener.rotation.copy(cameraRotation);
    }
  },
  updateVehicle: function(vehicle) {
    let accelerate, decelerate, idle;
    if ((vehicle.id + 1) % 2 == 0) {
      accelerate = audio.sounds["vehicle." + vehicle.type + ".accelerate"].sound;
      decelerate = audio.sounds["vehicle." + vehicle.type + ".decelerate"].sound;
      idle = audio.sounds["vehicle." + vehicle.type + ".idle"].sound;
    } else {
      accelerate = audio.sounds["vehicle." + vehicle.type + ".accelerate"].sound.alias;
      decelerate = audio.sounds["vehicle." + vehicle.type + ".decelerate"].sound.alias;
      idle = audio.sounds["vehicle." + vehicle.type + ".idle"].sound.alias;
    }
    if (typeof accelerate == "undefined" || typeof decelerate == "undefined" || typeof idle == "undefined") return;
    accelerate.position.set(vehicle.body.position.x, vehicle.body.position.y, vehicle.body.position.z);
    decelerate.position.set(vehicle.body.position.x, vehicle.body.position.y, vehicle.body.position.z);
    idle.position.set(vehicle.mesh.position.x, vehicle.mesh.position.y, vehicle.mesh.position.z);
    if (vehicle.physicsVariables.enginePower > 50 || vehicle.physicsVariables.enginePower < -50) {
      if ((vehicle.physicsVariables.gear == "reverse" && vehicle.physicsVariables.enginePower > 0) || (vehicle.physicsVariables.gear == "drive" && vehicle.physicsVariables.enginePower < 0) || !vehicle.physicsVariables.throttle) {
        audio.vehicleDecelerate(accelerate, decelerate);
      } else {
        audio.vehicleAccelerate(vehicle, accelerate, decelerate);
      }
    } else {
      audio.vehicleIdle(accelerate, decelerate, idle);
    }
  },
  reload: function(weapon, type = "normal") {
    const sound = audio.sounds[`reload.${weapon.name}.${type}`];
    sound.pause();
    sound.currentTime = 0;
    sound.play();
  },
  stopReload: function(weapon) {
    const sound1 = audio.sounds[`reload.${weapon.name}.normal`];
    const sound2 = audio.sounds[`reload.${weapon.name}.full`];
    sound1.pause();
    sound2.pause();
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
    sound.setMaxDistance(10);
    if (sound.source) sound.stop();
    sound.play();
  },
  grenadeExplosion: function(position, type, stuck = false) {
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
      sound.setMaxDistance(30);
      if (sound.source) sound.stop();
      sound.play();
    } else if (type == "plasma") {
      const sound = audio.sounds[`grenade.explosion.plasma.${stuck ? 2 : (currentExplodeSound + 1) % 2}`].sound;
      currentExplodeSound++;
      sound.position.copy(position);
      sound.setVolume(7);
      sound.setMaxDistance(30);
      if (sound.source) sound.stop();
      sound.play();
    }
  },
  ambience: function(id) {
    const sound = audio.sounds[`map.ambience.${id}`];
    sound.loop = true;
    sound.play();
  },
  dying: function(position) {
    const sound = audio.sounds["dying.0"].sound;
    sound.position.copy(position);
    sound.setVolume(10);
    sound.setRolloffFactor(0.5);
    sound.setMaxDistance(10);
    if (sound.source) sound.stop();
    sound.play();
  },
  vehicleAccelerate: function(vehicle, accelerateSound, decelerateSound) {
    if (accelerateSound.isPlaying) return;
    if (decelerateSound.source) decelerateSound.stop();
    accelerateSound.setVolume(0.5);
    accelerateSound.setMaxDistance(10);
    accelerateSound.offset = vehicle.speed / 2 + 1;
    accelerateSound.play();
  },
  vehicleDecelerate: function(accelerateSound, decelerateSound) {
    if (decelerateSound.isPlaying) return;
    if (accelerateSound.source) accelerateSound.stop();
    decelerateSound.setVolume(0.5);
    decelerateSound.setMaxDistance(10);
    decelerateSound.offset = 1;
    decelerateSound.play();
  },
  vehicleIdle: function(accelerateSound, decelerateSound, idleSound) {
    if (accelerateSound.isPlaying) audio.vehicleDecelerate(accelerateSound, decelerateSound);
    if (idleSound.isPlaying) return;
    idleSound.setVolume(0.5);
    idleSound.setMaxDistance(10);
    idleSound.loop = true;
    idleSound.play();
  },
  vehicleCrash: function(vehicle, intensity) {
    let sound = null;
    if (intensity < 5) {
      sound = audio.sounds["vehicle." + vehicle.type + ".small-crash"].sound;
    } else if (intensity < 12) {
      sound = audio.sounds["vehicle." + vehicle.type + ".big-crash"].sound;
    } else {
      sound = audio.sounds["vehicle." + vehicle.type + ".major-crash"].sound;
    }
    sound.position.set(vehicle.body.position.x, vehicle.body.position.y, vehicle.body.position.z);
    sound.setMaxDistance(12);
    if (sound.source) sound.stop();
    sound.play();
  },
  vehicleExplosion: function(vehicle) {
    const sound = audio.sounds["vehicle." + vehicle.type + ".explosion"].sound;
    sound.position.set(vehicle.body.position.x, vehicle.body.position.y, vehicle.body.position.z);
    sound.setVolume(7);
    sound.setMaxDistance(35);
    if (sound.source) sound.stop();
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
  "reload.SCAR-H.normal": AudioWrapper("/sounds/weapons/reloading/SCAR-H.mp3"),
  "reload.SCAR-H.full": AudioWrapper("/sounds/weapons/reloading/SCAR-H.full.mp3"),
  "fire.SCAR-H": AudioWrapper("/sounds/weapons/shooting/SCAR-H.mp3", true),
  "reload.30-SST.normal": AudioWrapper("/sounds/weapons/reloading/30-SST.mp3"),
  "reload.30-SST.full": AudioWrapper("/sounds/weapons/reloading/30-SST.full.mp3"),
  "fire.30-SST": AudioWrapper("/sounds/weapons/shooting/30-SST.mp3", true),
  "reload.HK-G28.normal": AudioWrapper("/sounds/weapons/reloading/HK-G28.mp3"),
  "reload.HK-G28.full": AudioWrapper("/sounds/weapons/reloading/HK-G28.full.mp3"),
  "fire.HK-G28": AudioWrapper("/sounds/weapons/shooting/HK-G28.mp3"),
  "grenade.hit.0": AudioWrapper3d("/sounds/grenades/hits/0.mp3"),
  "grenade.explosion.mk2": AudioWrapper3d("/sounds/grenades/explosions/0.mp3", true),
  "grenade.explosion.plasma.0": AudioWrapper3d("/sounds/grenades/explosions/1.mp3"),
  "grenade.explosion.plasma.1": AudioWrapper3d("/sounds/grenades/explosions/2.mp3"),
  "grenade.explosion.plasma.2": AudioWrapper3d("/sounds/grenades/explosions/3.mp3"),
  "map.ambience.0": AudioWrapper("/sounds/ambience/0.mp3"),
  "dying.0": AudioWrapper3d("/sounds/dying/0.mp3"),
  "vehicle.Jeep.accelerate": AudioWrapper3d("/sounds/vehicles/Jeep.accelerate.mp3", true),
  "vehicle.Jeep.decelerate": AudioWrapper3d("/sounds/vehicles/Jeep.decelerate.mp3", true),
  "vehicle.Jeep.idle": AudioWrapper3d("/sounds/vehicles/Jeep.idle.mp3", true),
  "vehicle.Jeep.major-crash": AudioWrapper3d("/sounds/vehicles/Jeep.major-crash.mp3"),
  "vehicle.Jeep.big-crash": AudioWrapper3d("/sounds/vehicles/Jeep.big-crash.mp3"),
  "vehicle.Jeep.small-crash": AudioWrapper3d("/sounds/vehicles/Jeep.small-crash.mp3"),
  "vehicle.Jeep.explosion": AudioWrapper3d("/sounds/vehicles/Jeep.explosion.mp3")
};

document.addEventListener("touchstart", () => {
  if (audio.ctx.state === "suspended") audio.ctx.resume();
}, { once: true });
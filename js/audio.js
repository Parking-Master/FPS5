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
      src: src,
      buffer: null,
      source: null,
      sources: [],
      loop: false,
      startTime: 0,
      offset: 0,
      playing: false,
      loaded: false,
      loadPromise: fetch(src).then(res => res.arrayBuffer()).then(buf => ctx.decodeAudioData(buf)).then(decoded => {
        wrapper.buffer = decoded;
        wrapper.loaded = true;
        audio.checkIfLoaded();
      }),
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
  let mainWrapper = {
    loaded: false
  };
  new THREE.AudioLoader().load(src, buffer => {
    let steps = 1;
    if (alias) steps = 2;
    for (let i = 0; i < steps; i++) {
      const sound = new THREE.PositionalAudio(camera.audioListener);
      sound.setBuffer(buffer);
      scene.add(sound);
      if (i == 0) {
        mainWrapper.sound = sound;
        mainWrapper.loaded = true;
        audio.checkIfLoaded();
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
  finishCallback: null,
  checkIfLoaded: function() {
    if (Object.values(audio.sounds).filter(a => a.loaded).length == Object.values(audio.sounds).length) audio.finishCallback();
  },
  initialize: function(callback) {
    const listener = new THREE.AudioListener();
    scene.add(listener);
    camera.audioListener = listener;
    let weapons = Object.keys(sandbox.weapons);
    audio.finishCallback = function() {
      callback();
    };
    audio.sounds = {
      "map.ambience.0": AudioWrapper("/sounds/ambience/0.mp3"),
      "grenade.hit.0": AudioWrapper3d("/sounds/grenades/hits/0.mp3"),
      "grenade.explosion.mk2": AudioWrapper3d("/sounds/grenades/explosions/0.mp3", true),
      "grenade.explosion.plasma.0": AudioWrapper3d("/sounds/grenades/explosions/1.mp3"),
      "grenade.explosion.plasma.1": AudioWrapper3d("/sounds/grenades/explosions/2.mp3"),
      "grenade.explosion.plasma.2": AudioWrapper3d("/sounds/grenades/explosions/3.mp3"),
      "ricochet.0": AudioWrapper3d("/sounds/weapons/ricochet/0.mp3"),
      "ricochet.1": AudioWrapper3d("/sounds/weapons/ricochet/1.mp3"),
      "ricochet.2": AudioWrapper3d("/sounds/weapons/ricochet/2.mp3"),
      "shields.low": AudioWrapper("/sounds/shields/low.mp3"),
      "shields.warning": AudioWrapper("/sounds/shields/warning.mp3"),
      "dying.0": AudioWrapper3d("/sounds/dying/0.mp3"),
      "hit.headshot": AudioWrapper("/sounds/shields/hit-headshot.mp3"),
      "hit": AudioWrapper("/sounds/shields/hit.mp3"),
      "weapon.pickup": AudioWrapper("/sounds/weapons/pickup.mp3"),
      "weapon.switch": AudioWrapper("/sounds/weapons/switch.mp3"),
      "weapon.punch.0": AudioWrapper("/sounds/weapons/punching/0.mp3"),
      "weapon.punch.1": AudioWrapper("/sounds/weapons/punching/1.mp3"),
      "weapon.punch.2": AudioWrapper("/sounds/weapons/punching/2.mp3"),
    };
    for (let i = 0; i < weapons.length; i++) {
      if (sandbox.weapons[weapons[i]].loaded) {
        audio.sounds["reload." + weapons[i] + ".normal"] = AudioWrapper("/sounds/weapons/reloading/" + weapons[i] + ".mp3");
        audio.sounds["reload." + weapons[i] + ".full"] = AudioWrapper("/sounds/weapons/reloading/" + weapons[i] + ".full.mp3");
        audio.sounds["fire." + weapons[i]] = AudioWrapper("/sounds/weapons/shooting/" + weapons[i] + ".mp3", true);
        audio.sounds["3d.fire." + weapons[i]] = AudioWrapper3d("/sounds/weapons/shooting/" + weapons[i] + ".mp3", true);
      }
    }
    [...new Set(sandbox.maps[sandbox.presets.map].vehicles.map(vehicle => vehicle.type))].forEach(vehicle => {
      audio.sounds["vehicle." + vehicle + ".accelerate"] = AudioWrapper3d("/sounds/vehicles/" + vehicle + "/accelerate.mp3", true);
      audio.sounds["vehicle." + vehicle + ".decelerate"] = AudioWrapper3d("/sounds/vehicles/" + vehicle + "/decelerate.mp3", true);
      audio.sounds["vehicle." + vehicle + ".horn"] = AudioWrapper3d("/sounds/vehicles/" + vehicle + "/horn.mp3", true);
      audio.sounds["vehicle." + vehicle + ".idle"] = AudioWrapper3d("/sounds/vehicles/idle.mp3", true);
      audio.sounds["vehicle." + vehicle + ".major-crash"] = AudioWrapper3d("/sounds/vehicles/major-crash.mp3");
      audio.sounds["vehicle." + vehicle + ".big-crash"] = AudioWrapper3d("/sounds/vehicles/big-crash.mp3");
      audio.sounds["vehicle." + vehicle + ".small-crash"] = AudioWrapper3d("/sounds/vehicles/small-crash.mp3");
      audio.sounds["vehicle." + vehicle + ".explosion"] = AudioWrapper3d("/sounds/vehicles/explosion.mp3");
    });
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
      horn = audio.sounds["vehicle." + vehicle.type + ".horn"].sound;
    } else {
      accelerate = audio.sounds["vehicle." + vehicle.type + ".accelerate"].sound.alias;
      decelerate = audio.sounds["vehicle." + vehicle.type + ".decelerate"].sound.alias;
      idle = audio.sounds["vehicle." + vehicle.type + ".idle"].sound.alias;
      horn = audio.sounds["vehicle." + vehicle.type + ".horn"].sound.alias;
    }
    if (typeof accelerate == "undefined" || typeof decelerate == "undefined" || typeof idle == "undefined") return;
    accelerate.position.set(vehicle.body.position.x, vehicle.body.position.y, vehicle.body.position.z);
    decelerate.position.set(vehicle.body.position.x, vehicle.body.position.y, vehicle.body.position.z);
    idle.position.set(vehicle.mesh.position.x, vehicle.mesh.position.y, vehicle.mesh.position.z);
    horn.position.set(vehicle.mesh.position.x, vehicle.mesh.position.y, vehicle.mesh.position.z);
    if (vehicle.physicsVariables.enginePower > 50 || vehicle.physicsVariables.enginePower < -50) {
      if ((vehicle.physicsVariables.gear == "reverse" && vehicle.physicsVariables.enginePower > 0) || (vehicle.physicsVariables.gear == "drive" && vehicle.physicsVariables.enginePower < 0) || !vehicle.physicsVariables.throttle) {
        audio.vehicleDecelerate(accelerate, decelerate);
      } else {
        audio.vehicleAccelerate(vehicle, accelerate, decelerate);
      }
    } else {
      audio.vehicleIdle(accelerate, decelerate, idle);
    }
    if (vehicle.horn) {
      audio.vehicleHornStart(horn);
    } else {
      audio.vehicleHornStop(horn);
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
    if ((weapon.fireMode == "auto" || weapon.fireMode == "burst") && (roundsFired + 1) % 2 == 0) {
      sound = audio.sounds[`fire.${weapon.name}`].alias;
    } else {
      sound = audio.sounds[`fire.${weapon.name}`];
    }
    sound.pause();
    sound.currentTime = 0;
    sound.play();
  },
  fire3D: function(weaponName, position) {
    let sound = audio.sounds[`3d.fire.${weaponName}`].sound;
    if (sound.isPlaying) sound = audio.sounds[`3d.fire.${weaponName}`].sound.alias;
    sound.position.copy(position);
    sound.setMaxDistance(100);
    if (sound.source) sound.setDetune(100 * (position.distanceTo(camera.position) / 10));
    sound.setVolume(2);
    if (sound.source) sound.stop();
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
  },
  vehicleHornStart: function(horn) {
    if (horn.isPlaying) return;
    horn.setVolume(4);
    horn.setMaxDistance(20);
    if (horn.source) horn.stop();
    horn.play();
  },
  vehicleHornStop: function(horn) {
    if (horn.isPlaying && horn.source) horn.stop();
  },
  ricochet: function(position) {
    let sound = audio.sounds["ricochet." + Math.floor(Math.random() * 3)].sound;
    sound.position.set(position.x, position.y, position.z);
    sound.setVolume(2);
    sound.setMaxDistance(40);
    if (sound.source) sound.stop();
    sound.play();
  },
  shieldsLow: function() {
    let sound = audio.sounds["shields.low"];
    if (sound.playing) return;
    sound.loop = true;
    sound.currentTime = 0;
    sound.play();
  },
  stopShieldsLow: function() {
    let sound = audio.sounds["shields.low"];
    sound.pause();
  },
  shieldsWarning: function() {
    let sound = audio.sounds["shields.warning"];
    if (sound.playing) return;
    sound.loop = true;
    sound.currentTime = 0;
    sound.play();
  },
  stopShieldsWarning: function() {
    let sound = audio.sounds["shields.warning"];
    sound.pause();
  },
  hitHeadshot: function() {
    let sound = audio.sounds["hit.headshot"];
    sound.currentTime = 0;
    sound.play();
  },
  hit: function() {
    let sound = audio.sounds["hit"];
    sound.currentTime = 0;
    sound.play();
  },
  weaponPickup: function() {
    if (audio.sounds["weapon.switch"].playing) audio.sounds["weapon.switch"].pause();
    let sound = audio.sounds["weapon.pickup"];
    sound.currentTime = 0;
    sound.play();
  },
  weaponSwitch: function() {
    if (audio.sounds["weapon.pickup"].playing) return;
    let sound = audio.sounds["weapon.switch"];
    sound.currentTime = 0;
    sound.play();
  },
  punch: function(impact = false) {
    let sound;
    if (impact) {
      sound = audio.sounds["weapon.punch.2"];
    } else {
      sound = audio.sounds["weapon.punch." + Math.floor(Math.random() * 2)];
    }
    sound.pause();
    sound.currentTime = 0;
    sound.play();
  }
};

document.addEventListener("touchstart", () => {
  if (audio.ctx.state === "suspended") audio.ctx.resume();
}, { once: true });
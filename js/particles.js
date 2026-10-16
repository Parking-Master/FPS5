let noiseData = new Uint8Array(4096);
for (let i = 0; i < 4096; i++) noiseData[i] = Math.random() * 255;
let noiseTexture = new THREE.DataTexture(noiseData, 64, 64, THREE.RedFormat);
particles = {
  cache: {
    particleGroups: [],
    materials: {
      smoke: new THREE.ShaderMaterial({
        uniforms: {
          noiseTexture: { value: noiseTexture }
        },
        vertexShader: `
          attribute float size;
          attribute vec3 customPosition;
          attribute float life;
          varying float vLife;
          void main() {
            vLife = life;
            vec4 pos = modelViewMatrix * vec4(customPosition, 1.0);
            gl_PointSize = size * 0.5 * (300.0 / -pos.z);
            gl_Position = projectionMatrix * pos;
          }`,
        fragmentShader: `
          varying float vLife;
          uniform sampler2D noiseTexture;
          void main() {
            float dist = distance(gl_PointCoord, vec2(0.5));
            if (dist > 0.5) discard;
            vec2 noiseCoord = gl_PointCoord * 4.0 + fract(vLife * 10.0);
            float noise = texture2D(noiseTexture, noiseCoord).r * 0.5 + 0.5;
            float alpha = 0.15 * vLife * noise * (1.0 - dist * 2.0);
            vec3 smokeColor = vec3(.67, .57, .5);
            gl_FragColor = vec4(smokeColor, alpha);
          }
        `,
        transparent: true,
        blending: THREE.NormalBlending,
        depthWrite: false
      }),
      blood: new THREE.ShaderMaterial({
        uniforms: {
          noiseTexture: { value: noiseTexture }
        },
        vertexShader: `
          attribute float size;
          attribute vec3 customPosition;
          attribute float life;
          varying float vLife;
          void main() {
            vLife = life;
            vec4 pos = modelViewMatrix * vec4(customPosition, 1.0);
            gl_PointSize = size * 0.5 * (300.0 / -pos.z);
            gl_Position = projectionMatrix * pos;
          }`,
        fragmentShader: `
          varying float vLife;
          uniform sampler2D noiseTexture;
          void main() {
            float dist = distance(gl_PointCoord, vec2(0.5));
            if (dist > 0.5) discard;
            vec2 noiseCoord = gl_PointCoord * 4.0 + fract(vLife * 10.0);
            float noise = texture2D(noiseTexture, noiseCoord).r * 0.5 + 0.5;
            float alpha = 0.15 * vLife * noise * (1.0 - dist * 2.0);
            vec3 bloodColor = vec3(0.4, 0.1, 0.1);
            gl_FragColor = vec4(bloodColor, alpha);
          }`,
        transparent: true,
        blending: THREE.NormalBlending,
        depthWrite: false
      }),
      explosion: new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0.0 },
          noiseTexture: { value: noiseTexture }
        },
        vertexShader: `
          attribute float size;
          attribute vec3 customPosition;
          attribute float life;
          uniform float time;
          varying float vLife;
          varying float vAge;
          void main() {
            vLife = life;
            vAge = 1.0 - life;
            vec3 pos = customPosition;
            float risePhase = smoothstep(0.0, 0.1, vAge);
            float peakPhase = smoothstep(0.1, 0.15, vAge);
            float fadePhase = smoothstep(0.15, 1.0, vAge);
            pos.y += risePhase * 0.8;
            pos.z += risePhase * 0.6;
            float turbulence = sin(vAge * 8.0 + pos.x * 5.0 + pos.y * 3.0) * 0.1;
            pos.x += turbulence * risePhase;
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            float sizeCurve = 0.0;
            sizeCurve += risePhase * 2.0;
            sizeCurve -= peakPhase * 1.5;
            sizeCurve *= (1.0 - fadePhase * 0.5);
            gl_PointSize = size * 45.0 * (300.0 / -mvPosition.z) * sizeCurve;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform sampler2D noiseTexture;
          uniform float time;
          varying float vLife;
          varying float vAge;
          void main() {
            vec2 coord = gl_PointCoord - 0.5;
            float dist = length(coord);
            if (dist > 0.45) discard;
            float risePhase = smoothstep(0.0, 0.3, vAge);
            float peakPhase = smoothstep(0.3, 0.6, vAge);
            float fadePhase = smoothstep(0.6, 1.0, vAge);
            vec3 fireCore = vec3(1.2, 0.3, 0.1);
            vec3 fireEdge = vec3(1.0, 0.3, 0.05);
            vec3 smoke = vec3(0.2, 0.2, 0.25);
            vec3 color = mix(fireCore, fireEdge, dist);
            color = mix(color, smoke, fadePhase);
            vec2 noiseCoord = gl_PointCoord * 5.0 + vAge * 12.0;
            float noise = texture2D(noiseTexture, noiseCoord).r * 0.3 + 0.7;
            float alpha = vLife * (1.0 - dist * 1.8) * noise;
            alpha *= 1.0 - fadePhase * 0.3;
            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      }),
      plasma: new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0.0 },
          noiseTexture: { value: noiseTexture }
        },
        vertexShader: `
          attribute float size;
          attribute vec3 customPosition;
          attribute float life;
          uniform float time;
          varying float vLife;
          varying float vAge;
          void main() {
            vLife = life;
            vAge = 1.0 - life;
            vec3 pos = customPosition;
            float risePhase = smoothstep(0.0, 0.1, vAge);
            float peakPhase = smoothstep(0.1, 0.15, vAge);
            float fadePhase = smoothstep(0.15, 1.0, vAge);
            pos.y += risePhase * 0.8;
            pos.z += risePhase * 0.6;
            float turbulence = sin(vAge * 8.0 + pos.x * 5.0 + pos.y * 3.0) * 0.1;
            pos.x += turbulence * risePhase;
            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            float sizeCurve = 0.0;
            sizeCurve += risePhase * 2.0;
            sizeCurve -= peakPhase * 1.5;
            sizeCurve *= (1.0 - fadePhase * 0.5);
            gl_PointSize = size * 80.0 * (300.0 / -mvPosition.z) * sizeCurve;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform sampler2D noiseTexture;
          uniform float time;
          varying float vLife;
          varying float vAge;
          void main() {
            vec2 coord = gl_PointCoord - 0.5;
            float dist = length(coord);
            if (dist > 0.45) discard;
            float risePhase = smoothstep(0.0, 0.3, vAge);
            float peakPhase = smoothstep(0.3, 0.6, vAge);
            float fadePhase = smoothstep(0.6, 1.0, vAge);
            vec3 fireCore = vec3(0.1, 0.3, 1);
            vec3 fireEdge = vec3(0.05, 0.3, 1);
            vec3 smoke = vec3(0.5, 0.2, 0.7);
            vec3 color = mix(fireCore, fireEdge, dist);
            color = mix(color, smoke, fadePhase);
            vec2 noiseCoord = gl_PointCoord * 5.0 + vAge * 12.0;
            float noise = texture2D(noiseTexture, noiseCoord).r * 0.3 + 0.7;
            float alpha = vLife * (1.0 - dist * 1.8) * noise;
            alpha *= 1.0 - fadePhase * 0.3;
            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    },
    geometries: {
      smoke: null,
      blood: null,
      explosion: null,
      plasma: null
    },
    points: {
      smoke: null,
      blood: null,
      explosion: null,
      plasma: null
    }
  },
  smoke: function(position, size = 1, life = 1) {
    let burst = { particles: [], material: particles.cache.materials.smoke };
    for (let i = 0; i < Math.round(50 * size); i++) {
      let particle = {
        x: position.x + ((Math.random() - 0.5) * .1),
        y: position.y + ((Math.random() - 0.5) * .1),
        z: position.z + Math.random() * 0.1,
        vx: (Math.random() - 0.5) * 2 * (size / 10),
        vy: (Math.random() - 0.1) * 2 * (size / 10),
        vz: (Math.random() - 0.5) * 2 * (size / 10),
        life: 2 * life,
        maxLife: 2 * life,
        size: Math.random() * size * window.devicePixelRatio * 2
      };
      burst.particles.push(particle);
    }
    particles.cache.particleGroups.push(burst);
    if (particles.cache.particleGroups.length > 20) particles.cache.particleGroups.shift();
  },
  blood: function(position, size = .5) {
    let burst = { particles: [], material: particles.cache.materials.blood };
    for (let i = 0; i < Math.round(50 * size); i++) {
      let particle = {
        x: position.x + ((Math.random() - 0.5) * .1),
        y: position.y + ((Math.random() - 0.5) * .1),
        z: position.z + Math.random() * 0.1,
        vx: (Math.random() - 0.5) * 2 * (size / 10),
        vy: (Math.random() - 0.1) * 2 * (size / 10),
        vz: (Math.random() - 0.5) * 2 * (size / 10),
        life: 2,
        maxLife: 2,
        size: Math.random() * size * window.devicePixelRatio
      };
      burst.particles.push(particle);
    }
    particles.cache.particleGroups.push(burst);
    if (particles.cache.particleGroups.length > 20) particles.cache.particleGroups.shift();
  },
  explosion: function(position, size = 1) {
    let burst = { particles: [], material: particles.cache.materials.explosion };
    for (let i = 0; i < 80; i++) {
      let particle = {
        x: position.x + (Math.random() - 0.5) * 0.2,
        y: position.y + (Math.random() - 0.5) * 0.2,
        z: (position.z + Math.random() * 0.15) - 1,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        vz: 0.15 + Math.random() * 0.2,
        life: .3,
        maxLife: .3,
        size: 0.02 + Math.random() * 0.06 * size
      };
      burst.particles.push(particle);
    }
    particles.cache.particleGroups.push(burst);
    if (particles.cache.particleGroups.length > 20) {
      particles.cache.particleGroups.shift();
    }
  },
  plasma: function(position) {
    let burst = { particles: [], material: particles.cache.materials.plasma };
    for (let i = 0; i < 80; i++) {
      let particle = {
        x: position.x + (Math.random() - 0.5) * 0.2,
        y: position.y + (Math.random() - 0.5) * 0.2,
        z: (position.z + Math.random() * 0.15) - 1,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        vz: 0.15 + Math.random() * 0.2,
        life: .2,
        maxLife: .2,
        size: 0.02 + Math.random() * 0.03
      };
      burst.particles.push(particle);
    }
    particles.cache.particleGroups.push(burst);
    if (particles.cache.particleGroups.length > 20) {
      particles.cache.particleGroups.shift();
    }
  },
  update: function(deltaTime) {
    let timeScale = deltaTime * 60;
    for (let b = particles.cache.particleGroups.length - 1; b >= 0; b--) {
      let particleGroup = particles.cache.particleGroups[b].particles;
      for (let i = particleGroup.length - 1; i >= 0; i--) {
        let p = particleGroup[i];
        p.vx *= Math.pow(0.96, timeScale);
        p.vy *= Math.pow(0.96, timeScale);
        p.vz *= Math.pow(0.96, timeScale);
        p.vy += 0.0004 * timeScale;
        p.x += p.vx * 0.8 * timeScale;
        p.y += p.vy * 0.8 * timeScale;
        p.z += p.vz * 0.8 * timeScale;
        p.size *= Math.pow(0.98, timeScale);
        p.life -= 0.022 * timeScale;
        if (p.life <= 0) particleGroup.splice(i, 1);
      }
      if (particleGroup.length === 0) particles.cache.particleGroups.splice(b, 1);
    }
    let smokeParticles = [];
    let bloodParticles = [];
    let explosionParticles = [];
    let plasmaParticles = [];
    for (let b = 0; b < particles.cache.particleGroups.length; b++) {
      if (particles.cache.particleGroups[b].material === particles.cache.materials.smoke) {
        smokeParticles.push(...particles.cache.particleGroups[b].particles);
      } else if (particles.cache.particleGroups[b].material === particles.cache.materials.blood) {
        bloodParticles.push(...particles.cache.particleGroups[b].particles);
      } else if (particles.cache.particleGroups[b].material === particles.cache.materials.explosion) {
        explosionParticles.push(...particles.cache.particleGroups[b].particles);
      } else if (particles.cache.particleGroups[b].material === particles.cache.materials.plasma) {
        plasmaParticles.push(...particles.cache.particleGroups[b].particles);
      }
    }
    if (smokeParticles.length > 0) {
      if (!particles.cache.geometries.smoke || !particles.cache.points.smoke) {
        particles.cache.geometries.smoke = new THREE.BufferGeometry();
        particles.cache.points.smoke = new THREE.Points(particles.cache.geometries.smoke, particles.cache.materials.smoke);
        particles.cache.points.smoke.frustumCulled = false;
        scene.add(particles.cache.points.smoke);
      }
      let positions = new Float32Array(smokeParticles.length * 3);
      let sizes = new Float32Array(smokeParticles.length);
      let lifeAttr = new Float32Array(smokeParticles.length);
      for (let i = 0; i < smokeParticles.length; i++) {
        let p = smokeParticles[i];
        positions[i * 3] = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = p.z;
        sizes[i] = p.size;
        lifeAttr[i] = p.life / p.maxLife;
      }
      particles.cache.geometries.smoke.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particles.cache.geometries.smoke.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      particles.cache.geometries.smoke.setAttribute('customPosition', new THREE.BufferAttribute(positions, 3));
      particles.cache.geometries.smoke.setAttribute('life', new THREE.BufferAttribute(lifeAttr, 1));
      particles.cache.geometries.smoke.attributes.position.needsUpdate = true;
      particles.cache.geometries.smoke.attributes.size.needsUpdate = true;
      particles.cache.geometries.smoke.attributes.customPosition.needsUpdate = true;
      particles.cache.geometries.smoke.attributes.life.needsUpdate = true;
      particles.cache.geometries.smoke.computeBoundingSphere();
    } else if (particles.cache.points.smoke) {
      scene.remove(particles.cache.points.smoke);
      particles.cache.geometries.smoke.dispose();
      particles.cache.points.smoke.material.dispose();
      particles.cache.points.smoke = undefined;
      particles.cache.geometries.smoke = undefined;
    }
    if (bloodParticles.length > 0) {
      if (!particles.cache.geometries.blood || !particles.cache.points.blood) {
        particles.cache.geometries.blood = new THREE.BufferGeometry();
        particles.cache.points.blood = new THREE.Points(particles.cache.geometries.blood, particles.cache.materials.blood);
        particles.cache.points.blood.frustumCulled = false;
        scene.add(particles.cache.points.blood);
      }
      let positions = new Float32Array(bloodParticles.length * 3);
      let sizes = new Float32Array(bloodParticles.length);
      let lifeAttr = new Float32Array(bloodParticles.length);
      for (let i = 0; i < bloodParticles.length; i++) {
        let p = bloodParticles[i];
        positions[i * 3] = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = p.z;
        sizes[i] = p.size;
        lifeAttr[i] = p.life / p.maxLife;
      }
      particles.cache.geometries.blood.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particles.cache.geometries.blood.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      particles.cache.geometries.blood.setAttribute('customPosition', new THREE.BufferAttribute(positions, 3));
      particles.cache.geometries.blood.setAttribute('life', new THREE.BufferAttribute(lifeAttr, 1));
      particles.cache.geometries.blood.attributes.position.needsUpdate = true;
      particles.cache.geometries.blood.attributes.size.needsUpdate = true;
      particles.cache.geometries.blood.attributes.customPosition.needsUpdate = true;
      particles.cache.geometries.blood.attributes.life.needsUpdate = true;
      particles.cache.geometries.blood.computeBoundingSphere();
    } else if (particles.cache.points.blood) {
      scene.remove(particles.cache.points.blood);
      particles.cache.geometries.blood.dispose();
      particles.cache.points.blood.material.dispose();
      particles.cache.points.blood = undefined;
      particles.cache.geometries.blood = undefined;
    }
    if (explosionParticles.length > 0) {
      if (!particles.cache.geometries.explosion || !particles.cache.points.explosion) {
        particles.cache.geometries.explosion = new THREE.BufferGeometry();
        particles.cache.points.explosion = new THREE.Points(particles.cache.geometries.explosion, particles.cache.materials.explosion);
        particles.cache.points.explosion.frustumCulled = false;
        scene.add(particles.cache.points.explosion);
      }
      let positions = new Float32Array(explosionParticles.length * 3);
      let sizes = new Float32Array(explosionParticles.length);
      let lifeAttr = new Float32Array(explosionParticles.length);
      for (let i = 0; i < explosionParticles.length; i++) {
        let p = explosionParticles[i];
        positions[i * 3] = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = p.z;
        sizes[i] = p.size;
        lifeAttr[i] = p.life / p.maxLife;
      }
      particles.cache.geometries.explosion.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particles.cache.geometries.explosion.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      particles.cache.geometries.explosion.setAttribute('customPosition', new THREE.BufferAttribute(positions, 3));
      particles.cache.geometries.explosion.setAttribute('life', new THREE.BufferAttribute(lifeAttr, 1));
      particles.cache.geometries.explosion.attributes.position.needsUpdate = true;
      particles.cache.geometries.explosion.attributes.size.needsUpdate = true;
      particles.cache.geometries.explosion.attributes.customPosition.needsUpdate = true;
      particles.cache.geometries.explosion.attributes.life.needsUpdate = true;
    } else if (particles.cache.points.explosion) {
      scene.remove(particles.cache.points.explosion);
      particles.cache.geometries.explosion.dispose();
      particles.cache.points.explosion.material.dispose();
      particles.cache.points.explosion = undefined;
      particles.cache.geometries.explosion = undefined;
    }
    if (plasmaParticles.length > 0) {
      if (!particles.cache.geometries.plasma || !particles.cache.points.plasma) {
        particles.cache.geometries.plasma = new THREE.BufferGeometry();
        particles.cache.points.plasma = new THREE.Points(particles.cache.geometries.plasma, particles.cache.materials.plasma);
        particles.cache.points.plasma.frustumCulled = false;
        scene.add(particles.cache.points.plasma);
      }
      let positions = new Float32Array(plasmaParticles.length * 3);
      let sizes = new Float32Array(plasmaParticles.length);
      let lifeAttr = new Float32Array(plasmaParticles.length);
      for (let i = 0; i < plasmaParticles.length; i++) {
        let p = plasmaParticles[i];
        positions[i * 3] = p.x;
        positions[i * 3 + 1] = p.y;
        positions[i * 3 + 2] = p.z;
        sizes[i] = p.size;
        lifeAttr[i] = p.life / p.maxLife;
      }
      particles.cache.geometries.plasma.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particles.cache.geometries.plasma.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      particles.cache.geometries.plasma.setAttribute('customPosition', new THREE.BufferAttribute(positions, 3));
      particles.cache.geometries.plasma.setAttribute('life', new THREE.BufferAttribute(lifeAttr, 1));
      particles.cache.geometries.plasma.attributes.position.needsUpdate = true;
      particles.cache.geometries.plasma.attributes.size.needsUpdate = true;
      particles.cache.geometries.plasma.attributes.customPosition.needsUpdate = true;
      particles.cache.geometries.plasma.attributes.life.needsUpdate = true;
    } else if (particles.cache.points.plasma) {
      scene.remove(particles.cache.points.plasma);
      particles.cache.geometries.plasma.dispose();
      particles.cache.points.plasma.material.dispose();
      particles.cache.points.plasma = undefined;
      particles.cache.geometries.plasma = undefined;
    }
  }
};
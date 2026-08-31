text = {
  createUsername: function(username, isEnemy) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 300;
    canvas.height = 192;
    ctx.fillStyle = isEnemy ? "#ff0000" : "#6dc2e7";
    ctx.font = "15px Arial";
    ctx.fontWeight = "600";
    ctx.textAlign = "center";
    ctx.shadowColor = isEnemy ? "#ff3333" : "#baebff";
    ctx.shadowBlur = 1;
    ctx.fillText(username.toUpperCase(), canvas.width / 2, canvas.height / 2 - 10);
    const arrowWidth = 14;
    const arrowHeight = 14;
    const arrowStart = [canvas.width / 2, canvas.height / 2 + 16 - 10];
    ctx.moveTo(arrowStart[0], arrowStart[1]);
    ctx.lineTo(arrowStart[0] - (arrowWidth / 2), arrowStart[1] - arrowHeight);
    ctx.lineTo(arrowStart[0] + (arrowWidth / 2), arrowStart[1] - arrowHeight);
    ctx.lineTo(arrowStart[0], arrowStart[1]);
    ctx.fill();
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, sizeAttenuation: false, depthTest: isEnemy, depthWrite: false }));
    sprite.scale.set(0.3, 0.188, 1);
    sprite.position.y = 1.25;
    sprite.name = "UsernamePointer";
    return sprite;
  },
  createWeapon: function(weapon, callback = () => {}) {
    let weaponIcon = new Image();
    weaponIcon.src = "/images/weapons/" + weapon + ".png";
    weaponIcon.onload = function() {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = 600;
      canvas.height = 192;
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#ffffff";
      if (sandbox.weapons[weapon].displayName.length < 15) {
        ctx.font = "15px Arial";
      } else {
        ctx.font = "18px Arial";
      }
      ctx.fontWeight = "600";
      ctx.textAlign = "left";
      ctx.shadowColor = "#baebff";
      ctx.shadowBlur = 1;
      let imagePosition = [(canvas.width / 2) - 50, 0];
      let imageSize = [100, 50];
      if (sandbox.weapons[weapon].type == "pistol") {
        imagePosition = [(canvas.width / 2) - 38, 0];
        imageSize = [75, 75];
      }
      ctx.drawImage(weaponIcon, imagePosition[0], imagePosition[1], imageSize[0], imageSize[1]);
      ctx.fillText(sandbox.weapons[weapon].displayName.toUpperCase(), (canvas.width / 2) + 60, 25);
      ctx.moveTo(canvas.width / 2, 40);
      ctx.lineTo(canvas.width / 2, canvas.height / 2);
      ctx.stroke();
      const texture = new THREE.Texture(canvas);
      texture.needsUpdate = true;
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, sizeAttenuation: false, depthTest: false, depthWrite: false }));
      sprite.scale.set(10, 3.8, 1);
      sprite.position.y = 1.25;
      sprite.name = "WeaponPointer";
      callback(sprite);
    }
  }
};
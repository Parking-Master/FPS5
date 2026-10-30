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
      canvas.width = 200;
      canvas.height = 400;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.shadowColor = "#000";
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.shadowBlur = 0;
      let imageWidth = sandbox.weapons[weapon].holdType == "rifle" ? 200 : 150;
      let imageHeight = sandbox.weapons[weapon].holdType == "rifle" ? 100 : 150;
      ctx.drawImage(weaponIcon, (canvas.width / 2) - (imageWidth / 2), 0, imageWidth, imageHeight);
      let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < imgData.data.length; i += 4) {
        if (imgData.data[i + 3] != 0) {
          imgData.data[i] = 255;
          imgData.data[i + 1] = 255;
          imgData.data[i + 2] = 255;
          imgData.data[i + 3] = 255 * .7;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      ctx.lineWidth = 5;
      ctx.moveTo(canvas.width / 2, imageHeight);
      ctx.lineTo(canvas.width / 2, canvas.height / 2);
      ctx.stroke();
      const texture = new THREE.Texture(canvas);
      texture.needsUpdate = true;
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, sizeAttenuation: false, depthTest: false, depthWrite: false }));
      sprite.scale.set(1.5, 3, 1);
      sprite.name = "WeaponPointer";
      callback(sprite);
    }
  }
};
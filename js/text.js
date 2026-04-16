text = {
  createUsername: function(username) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const metrics = ctx.measureText(username);
    canvas.width = Math.max(metrics.width + 8, 150);
    canvas.height = 96;
    ctx.fillStyle = "#ff0000";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(username, canvas.width / 2, canvas.height / 2 - 10);
    const arrowWidth = 10;
    const arrowHeight = 10;
    const arrowStart = [canvas.width / 2, canvas.height / 2 + 16 - 10];
    ctx.moveTo(arrowStart[0], arrowStart[1]);
    ctx.lineTo(arrowStart[0] - (arrowWidth / 2), arrowStart[1] - arrowHeight);
    ctx.lineTo(arrowStart[0] + (arrowWidth / 2), arrowStart[1] - arrowHeight);
    ctx.lineTo(arrowStart[0], arrowStart[1]);
    ctx.fill();
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, sizeAttenuation: false }));
    sprite.scale.set(0.3, 0.25, 0.25);
    sprite.position.y = 1.5;
    return sprite;
  }
};
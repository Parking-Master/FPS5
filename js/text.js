text = {
  createUsername: function(username, isEnemy) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const metrics = ctx.measureText(username.toUpperCase());
    canvas.width = Math.max(metrics.width + 8, 150);
    canvas.height = 96;
    ctx.fillStyle = isEnemy ? "#ff0000" : "#6dc2e7";
    ctx.font = "16px Arial";
    ctx.fontWeight = "600";
    ctx.textAlign = "center";
    ctx.shadowColor = isEnemy ? "#ff3333" : "#baebff";
    ctx.shadowBlur = 1;
    ctx.fillText(username.toUpperCase(), canvas.width / 2, canvas.height / 2 - 10);
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
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, sizeAttenuation: false, depthTest: isEnemy, depthWrite: false }));
    sprite.scale.set(0.15, 0.09, 1);
    sprite.position.y = 1.3;
    sprite.name = "UsernamePointer";
    return sprite;
  }
};
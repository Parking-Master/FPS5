GamepadControls = {
  lookSpeed: 5, // Between 1 and 10
  lookSensitivity: 5, // Between 1 and 10
  data: {
    lookDelta: 0,
    autoLockPoint: null
  },
  buttonRepeats: {},
  buttonsDown: {},
  buttonMappings: ["a", "b", "x", "y", "lb", "rb", "lt", "rt", "back", "start", "l", "r", "up", "down", "left", "right"],
  buttonKeyMappings: ["Space", "KeyB", 1, "KeyY", null, "KeyR", "KeyG", "KeyF", "KeyL", null, "KeyC", "KeyI", null, null, null, null],
  update: function(clockDelta, walkSpeed) {
    let gamepads = navigator.getGamepads();
    if (gamepads.length < 1) return false;
    let gamepad = gamepads[0];
    for (let i = 0; i < gamepad.buttons.length; i++) {
      let button = gamepad.buttons[i];
      let mappedButton = GamepadControls.buttonMappings[i];
      let mappedButtonKey = GamepadControls.buttonKeyMappings[i];
      if (!mappedButtonKey) continue;
      if (button.pressed) {
        GamepadControls.buttonsDown[mappedButton] = false;
        if (typeof GamepadControls.buttonRepeats[mappedButton] === "undefined") GamepadControls.buttonRepeats[mappedButton] = false;
        GamepadControls.onbuttondown({
          button: mappedButton,
          code: mappedButtonKey,
          repeat: GamepadControls.buttonRepeats[mappedButton],
          gamepad: gamepad
        });
        GamepadControls.buttonRepeats[mappedButton] = true;
      } else {
        if (!GamepadControls.buttonsDown[mappedButton]) GamepadControls.onbuttonup({
          button: mappedButton,
          code: mappedButtonKey,
          gamepad: gamepad
        });
        GamepadControls.buttonsDown[mappedButton] = true;
        GamepadControls.buttonRepeats[mappedButton] = false;
      }
    }
    GamepadControls.updateLooking(clockDelta, gamepad);
    GamepadControls.updateWalking(gamepad, walkSpeed);
    return true;
  },
  onbuttondown: function(event) {
    utils.game.keyDownFunction(event);
    if (event.button == "x" && event.gamepad.axes[1] < -.95) utils.weapons.sprint();
  },
  onbuttonup: function(event) {
    utils.game.keyUpFunction(event);
  },
  updateLooking: function(clockDelta, gamepad) {
    if (deathScreen) return;
    let lookX = gamepad.axes[2];
    let lookY = gamepad.axes[3];
    let threshold = .4;
    let looking = false;
    if (Math.abs(lookX) > threshold || Math.abs(lookY) > threshold) {
      looking = true;
      let calculatedLookDelta = GamepadControls.data.lookDelta + ((GamepadControls.lookSensitivity) / ((utils.options.get("Zoomed") || GamepadControls.data.autoLockPoint) ? 200 : 100));
      if (GamepadControls.data.lookDelta <= 0) GamepadControls.data.lookDelta = .4;
      GamepadControls.data.lookDelta = Math.min(calculatedLookDelta, GamepadControls.lookSpeed / 4.2);
      let rotX = Math.max(GamepadControls.data.lookDelta, .4) * lookX * Math.max(Math.min(GamepadControls.data.autoLockPoint ? 10 / GamepadControls.data.autoLockPoint.distance : 1, 1), .6);
      let rotY = Math.max(GamepadControls.data.lookDelta, .4) * lookY * Math.max(Math.min(GamepadControls.data.autoLockPoint ? 10 / GamepadControls.data.autoLockPoint.distance : 1, 1), .6) * .8;
      camera.rotation.y -= Math.min(Math.pow(Math.abs(rotX), 2), GamepadControls.lookSpeed / 2) * (rotX < 0 ? -1 : 1) * PointerControls.pointerSpeed * clockDelta;
      camera.rotation.x -= Math.min(Math.pow(Math.abs(rotY), 1.7), GamepadControls.lookSpeed / 2) * (rotY < 0 ? -1 : 1) * PointerControls.pointerSpeed * clockDelta;
    } else {
      GamepadControls.data.lookDelta = 0;
    }
    const raycaster = utils.options.get("aimRaycaster");
    raycaster.setFromCamera(new THREE.Vector2(), camera);
    const intersects = raycaster.intersectObjects(utils.players.autoLockSpheres);
    if (intersects.length > 0) {
      if (looking || (!GamepadControls.data.autoLockPoint && utils.options.get("Walking"))) GamepadControls.data.autoLockPoint = intersects[0];
    } else {
      if (utils.options.get("Walking")) GamepadControls.data.autoLockPoint = null;
    }
    if (GamepadControls.data.autoLockPoint && (utils.options.get("Walking") || utils.options.get("Jumping"))) {
      const matrix = vectors[36].lookAt(camera.position, GamepadControls.data.autoLockPoint.point, camera.up);
      vectors[16].setFromRotationMatrix(matrix);
      camera.quaternion.slerp(vectors[16], Math.min(.01 / GamepadControls.data.autoLockPoint.distance, .01));
    }
  },
  updateWalking: function(gamepad, walkSpeed) {
    if (deathScreen) return;
    let walkX = gamepad.axes[1];
    let walkY = gamepad.axes[0];
    let threshold = .4;
    if (walkX <= -.96 && Math.abs(walkY) < .5) walkX = -1, walkY = 0;
    if (walkX >= .96 && Math.abs(walkY) < .5) walkX = 1, walkY = 0;
    if (walkY <= -.96 && Math.abs(walkX) < .5) walkX = 0, walkY = -1;
    if (walkY >= .96 && Math.abs(walkX) < .5) walkX = 0, walkY = 1;
    if (Math.abs(walkX) > threshold || Math.abs(walkY) > threshold) {
      if (!utils.options.get("Walking")) utils.weapons.startWalking();
      playerVelocity.add(utils.physics.getCameraForwardVector().multiplyScalar(-walkX * walkSpeed));
      playerVelocity.add(utils.physics.getCameraSideVector().multiplyScalar(walkY * walkSpeed));
      if (utils.options.get("Sprinting") && walkX > -.93) utils.weapons.stopSprint(), utils.weapons.update();
    } else {
      if (utils.options.get("Walking")) utils.weapons.stopWalking();
    }
  }
};
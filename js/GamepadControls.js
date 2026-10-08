GamepadControls = {
  lookSpeed: 5, // Between 1 and 10
  lookSensitivity: 5, // Between 1 and 10
  data: {
    lookDelta: 0
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
    let threshold = .3;
    if (Math.abs(lookX) > threshold || Math.abs(lookY) > threshold) {
      let calculatedLookDelta = GamepadControls.data.lookDelta + ((GamepadControls.lookSensitivity) / (utils.options.get("Zoomed") ? 500 : 450));
      GamepadControls.data.lookDelta = Math.min(calculatedLookDelta, GamepadControls.lookSpeed / 2.5);
      let rotX = Math.max(GamepadControls.data.lookDelta, .8) * lookX * (utils.options.get("Sprinting") ? 1.3 : 1);
      let rotY = Math.max(GamepadControls.data.lookDelta, .8) * lookY * (utils.options.get("Sprinting") ? 1.3 : 1) * .8;
      camera.rotation.y -= Math.min(Math.pow(Math.abs(rotX), 2), GamepadControls.lookSpeed / 2) * (rotX < 0 ? -1 : 1) * PointerControls.pointerSpeed * clockDelta;
      camera.rotation.x -= Math.min(Math.pow(Math.abs(rotY), 1.7), GamepadControls.lookSpeed / 2) * (rotY < 0 ? -1 : 1) * PointerControls.pointerSpeed * clockDelta;
    } else {
      GamepadControls.data.lookDelta = 0;
    }
  },
  updateWalking: function(gamepad, walkSpeed) {
    if (deathScreen) return;
    let walkX = gamepad.axes[1];
    let walkY = gamepad.axes[0];
    let threshold = .4;
    if (walkX <= -.96) walkX = -1, walkY = 0;
    if (walkX >= .96) walkX = 1, walkY = 0;
    if (walkY <= -.96) walkX = 0, walkY = -1;
    if (walkY >= .96) walkX = 0, walkY = 1;
    if (Math.abs(walkX) > threshold || Math.abs(walkY) > threshold) {
      if (!utils.options.get("Walking")) utils.weapons.startWalking();
      playerVelocity.add(utils.physics.getCameraForwardVector().multiplyScalar(-walkX * walkSpeed));
      playerVelocity.add(utils.physics.getCameraSideVector().multiplyScalar(walkY * walkSpeed));
      if (utils.options.get("Sprinting") && walkX > -.96) utils.weapons.stopSprint(), utils.weapons.update();
    } else {
      if (utils.options.get("Walking")) utils.weapons.stopWalking();
    }
  }
};
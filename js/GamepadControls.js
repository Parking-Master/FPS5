GamepadControls = {
  lookSpeed: 5, // Between 1 and 10
  lookSensitivity: 5, // Between 1 and 10
  data: {
    lookDelta: 0
  },
  buttonRepeats: {},
  buttonsDown: {},
  buttonMappings: ["a", "b", "x", "y", "lb", "rb", "lt", "rt", "back", "start", "l", "r", "up", "down", "left", "right"],
  buttonKeyMappings: ["Space", "KeyB", null, "KeyY", null, "KeyR", "KeyG", "KeyF", null, null, "KeyC", "KeyI", null, null, null, null],
  update: function(deltaTime, clockDelta, walkSpeed) {
    let gamepads = navigator.getGamepads();
    if (gamepads.length < 1) return false;
    let gamepad = gamepads[0];
    for (let i = 0; i < gamepad.buttons.length; i++) {
      let button = gamepad.buttons[i];
      let mappedButton = GamepadControls.buttonMappings[i];
      if (button.pressed) {
        GamepadControls.buttonsDown[mappedButton] = false;
        if (typeof GamepadControls.buttonRepeats[mappedButton] === "undefined") GamepadControls.buttonRepeats[mappedButton] = false;
        GamepadControls.onbuttondown({
          button: mappedButton,
          key: GamepadControls.buttonKeyMappings[i],
          repeat: GamepadControls.buttonRepeats[mappedButton],
          gamepad: gamepad
        });
        GamepadControls.buttonRepeats[mappedButton] = true;
      } else {
        if (!GamepadControls.buttonsDown[mappedButton]) GamepadControls.onbuttonup({
          button: mappedButton,
          key: GamepadControls.buttonKeyMappings[i],
          gamepad: gamepad
        });
        GamepadControls.buttonsDown[mappedButton] = true;
        GamepadControls.buttonRepeats[mappedButton] = false;
      }
    }
    GamepadControls.updateLooking(deltaTime, clockDelta, gamepad);
    GamepadControls.updateWalking(deltaTime, gamepad, walkSpeed);
    return true;
  },
  onbuttondown: function(event) {
    keyStates[event.key] = true;
    if (!event.repeat && !deathScreen) utils.game.keyDownFunction(event.key);
    if (event.button == "x" && event.gamepad.axes[1] < -.96) utils.weapons.sprint();
  },
  onbuttonup: function(event) {
    keyStates[event.key] = false;
    utils.game.keyUpFunction(event.key);
  },
  updateLooking: function(deltaTime, clockDelta, gamepad) {
    let lookX = gamepad.axes[2];
    let lookY = gamepad.axes[3];
    let threshold = .35;
    if (Math.abs(lookX) > threshold || Math.abs(lookY) > threshold) {
      if (GamepadControls.data.lookDelta <= 0) GamepadControls.data.lookDelta = .3;
      let calculatedLookDelta = GamepadControls.data.lookDelta + ((GamepadControls.lookSensitivity) / (utils.options.get("Zoomed") ? 300 : 200));
      GamepadControls.data.lookDelta = Math.min(calculatedLookDelta, GamepadControls.lookSpeed / 4);
      camera.rotation.y -= GamepadControls.data.lookDelta * Math.pow(lookX, 3) * PointerControls.pointerSpeed * 1 * clockDelta;
      camera.rotation.x -= GamepadControls.data.lookDelta * Math.pow(lookY, 3) * PointerControls.pointerSpeed * 1 * clockDelta * .65;
    } else {
      GamepadControls.data.lookDelta = 0;
    }
  },
  updateWalking: function(deltaTime, gamepad, walkSpeed) {
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
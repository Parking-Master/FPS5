GamepadControls = {
  lookSpeed: 5, // Between 1 and 10
  lookSensitivity: 5, // Between 1 and 10
  data: {
    lookDelta: 0,
    autoLockPoint: null,
    interactButtonTime: null
  },
  buttonRepeats: {},
  buttonsDown: {},
  buttonMappings: ["a", "b", "x", "y", "lb", "rb", "lt", "rt", "back", "start", "l", "r", "up", "down", "left", "right"],
  buttonKeyMappings: ["Space", "KeyB", 1, "KeyY", null, 1, "KeyG", "KeyF", "KeyL", null, "KeyC", "KeyI", null, null, null, null],
  update: function(deltaTime, clockDelta, time, walkSpeed) {
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
          gamepad: gamepad,
          timestamp: time
        });
        GamepadControls.buttonRepeats[mappedButton] = true;
      } else {
        if (!GamepadControls.buttonsDown[mappedButton]) GamepadControls.onbuttonup({
          button: mappedButton,
          code: mappedButtonKey,
          gamepad: gamepad,
          timestamp: time
        });
        GamepadControls.buttonsDown[mappedButton] = true;
        GamepadControls.buttonRepeats[mappedButton] = false;
      }
    }
    if (GamepadControls.data.interactButtonTime != null && time - GamepadControls.data.interactButtonTime > 200) {
      utils.game.keyDownFunction({ code: "KeyT", repeat: false });
      GamepadControls.data.interactButtonTime = null;
    }
    let vehicle = utils.vehicles.check();
    GamepadControls.updateLooking(clockDelta, gamepad, vehicle);
    GamepadControls.updateWalking(deltaTime, gamepad, vehicle, walkSpeed);
    return true;
  },
  onbuttondown: function(event) {
    utils.game.keyDownFunction(event);
    if (!event.repeat) {
      if (event.button == "rb" && GamepadControls.data.interactButtonTime == null) GamepadControls.data.interactButtonTime = event.timestamp;
      if (event.button == "x") {
        if (utils.vehicles.check(true)) {
          utils.vehicles.switchView();
        } else if (event.gamepad.axes[1] < -.95) {
          utils.weapons.sprint();
        }
      }
    }
  },
  onbuttonup: function(event) {
    utils.game.keyUpFunction(event);
    if (event.button == "rb") {
      utils.game.keyDownFunction({ code: "KeyR", repeat: false });
      GamepadControls.data.interactButtonTime = null;
    }
  },
  updateLooking: function(clockDelta, gamepad, vehicle) {
    if (deathScreen) return;
    let lookX = gamepad.axes[2];
    let lookY = gamepad.axes[3];
    let threshold = .4;
    let looking = false;
    if (vehicle && vehicle.currentView == 0) vehicle.physicsVariables.heading = Math.max(Math.min(camera.rotation.y * 1.5, vehicle.physicsVariables.maxHeading), -vehicle.physicsVariables.maxHeading);
    if (Math.abs(lookX) > threshold || Math.abs(lookY) > threshold) {
      looking = true;
      if (GamepadControls.data.lookDelta <= 0) GamepadControls.data.lookDelta = .4 * (GamepadControls.lookSpeed / 5);
      GamepadControls.data.lookDelta = Math.min(GamepadControls.data.lookDelta + GamepadControls.lookSensitivity * clockDelta, GamepadControls.lookSpeed / 4.2);
      let rotationFactor = GamepadControls.data.lookDelta * Math.max(Math.min(GamepadControls.data.autoLockPoint ? 10 / GamepadControls.data.autoLockPoint.distance : 1, 1), .6);
      let rotationFactorX = rotationFactor * lookX;
      let rotationFactorY = rotationFactor * lookY * .8;
      let isAiming = utils.options.get("Aiming");
      let lookDeltaX = Math.min(Math.pow(Math.abs(rotationFactorX), 2), GamepadControls.lookSpeed / 2) * (rotationFactorX < 0 ? -1 : 1) * PointerControls.pointerSpeed * (isAiming ? .8 : 1) * (GamepadControls.data.autoLockPoint ? .6 : 1) * clockDelta;
      let lookDeltaY = Math.min(Math.pow(Math.abs(rotationFactorY), 1.7), GamepadControls.lookSpeed / 2) * (rotationFactorY < 0 ? -1 : 1) * PointerControls.pointerSpeed * (isAiming ? .7 : 1) * (GamepadControls.data.autoLockPoint ? .6 : 1) * clockDelta;
      camera.rotation.y -= lookDeltaX;
      camera.rotation.x -= lookDeltaY;
      if (vehicle && vehicle.currentView == 1) vehicle.physicsVariables.heading = Math.max(Math.min(vehicle.physicsVariables.heading - (lookX / 120), vehicle.physicsVariables.maxHeading), -vehicle.physicsVariables.maxHeading);
    } else {
      GamepadControls.data.lookDelta = 0;
    }
    const raycaster = utils.options.get("aimRaycaster");
    raycaster.setFromCamera(vectors[37], camera);
    const intersects = raycaster.intersectObjects(utils.players.autoLockBoxes);
    if (intersects.length > 0) {
      utils.options.set("AllowAimUpdate", true);
      if (looking || (!GamepadControls.data.autoLockPoint && utils.options.get("Walking"))) GamepadControls.data.autoLockPoint = intersects[0];
    } else {
      if (utils.options.get("AllowAimUpdate")) utils.weapons.updateAim(utils.weapons.getCurrentEntry());
      utils.options.set("AllowAimUpdate", false);
      if (utils.options.get("Walking")) GamepadControls.data.autoLockPoint = null;
    }
    if (GamepadControls.data.autoLockPoint && (utils.options.get("Walking") || utils.options.get("Jumping")) && GamepadControls.data.autoLockPoint.distance > 2) {
      vectors[16].setFromRotationMatrix(vectors[36].lookAt(camera.position, GamepadControls.data.autoLockPoint.point, camera.up));
      camera.quaternion.slerp(vectors[16], Math.min(.08 * (4 / GamepadControls.data.autoLockPoint.distance), .08));
    }
  },
  updateWalking: function(deltaTime, gamepad, vehicle, walkSpeed) {
    if (deathScreen) return;
    let walkX = gamepad.axes[1];
    let walkY = gamepad.axes[0];
    let threshold = .4;
    if (vehicle) {
      if (walkX < -threshold) {
        utils.vehicles.throttle(vehicle, "drive", deltaTime);
      } else if (walkX > threshold) {
        utils.vehicles.throttle(vehicle, "reverse", deltaTime);
      } else {
        utils.vehicles.stopThrottle(vehicle);
      }
    } else {
      if (walkX <= -.96 && Math.abs(walkY) < .5) walkX = -1, walkY = 0;
      if (walkX >= .96 && Math.abs(walkY) < .5) walkX = 1, walkY = 0;
      if (walkY <= -.96 && Math.abs(walkX) < .5) walkX = 0, walkY = -1;
      if (walkY >= .96 && Math.abs(walkX) < .5) walkX = 0, walkY = 1;
      let isWalking = utils.options.get("Walking");
      if (Math.abs(walkX) > threshold || Math.abs(walkY) > threshold) {
        if (!isWalking) utils.weapons.startWalking();
        playerVelocity.add(utils.physics.getCameraForwardVector().multiplyScalar(-walkX * walkSpeed));
        playerVelocity.add(utils.physics.getCameraSideVector().multiplyScalar(walkY * walkSpeed));
        if (utils.options.get("Sprinting") && walkX > -.93) utils.weapons.stopSprint(), utils.weapons.update();
      } else {
        if (isWalking) utils.weapons.stopWalking();
      }
    }
  }
};
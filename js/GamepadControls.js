GamepadApiControls = function() {
  let _this = this;
  this.lookSpeed = 5; // Between 1 and 10
  this.lookSensitivity = 5; // Between 1 and 10
  this.data = {
    lookDelta: 0,
    autoLockPoint: null,
    interactButtonTime: null
  };
  this.buttonRepeats = {};
  this.buttonsDown = {};
  this.buttonMappings = ["a", "b", "x", "y", "lb", "rb", "lt", "rt", "back", "start", "l", "r", "up", "down", "left", "right"],
  this.buttonKeyMappings = [];
  this.update = function(deltaTime, clockDelta, time, walkSpeed) {
    let gamepads = navigator.getGamepads();
    if (gamepads.length < 1 || gamepads[0] == null) return false;
    let gamepad = gamepads[0];
    for (let i = 0; i < gamepad.buttons.length; i++) {
      let button = gamepad.buttons[i];
      let mappedButton = _this.buttonMappings[i];
      let mappedButtonKey = _this.buttonKeyMappings[i];
      if (!mappedButtonKey) continue;
      if (button.pressed) {
        _this.buttonsDown[mappedButton] = false;
        if (typeof _this.buttonRepeats[mappedButton] === "undefined") _this.buttonRepeats[mappedButton] = false;
        _this.onbuttondown({
          button: mappedButton,
          code: mappedButtonKey,
          repeat: _this.buttonRepeats[mappedButton],
          gamepad: gamepad,
          timestamp: time
        });
        _this.buttonRepeats[mappedButton] = true;
      } else {
        if (!_this.buttonsDown[mappedButton]) _this.onbuttonup({
          button: mappedButton,
          code: mappedButtonKey,
          gamepad: gamepad,
          timestamp: time
        });
        _this.buttonsDown[mappedButton] = true;
        _this.buttonRepeats[mappedButton] = false;
      }
    }
    if (_this.data.interactButtonTime != null && time - _this.data.interactButtonTime > 200) {
      utils.game.keyDownFunction({ code: sandbox.settings.bindings.keyboard.interact[0], repeat: false });
      _this.data.interactButtonTime = null;
    }
    let vehicle = utils.vehicles.check();
    _this.updateLooking(clockDelta, gamepad, vehicle);
    _this.updateWalking(deltaTime, gamepad, vehicle, walkSpeed);
    return true;
  };
  this.onbuttondown = function(event) {
    if (!event.repeat && sandbox.settings.bindings.gamepad.interact.includes(event.button) && _this.data.interactButtonTime == null) return _this.data.interactButtonTime = event.timestamp;
    utils.game.keyDownFunction(event);
    if (!event.repeat) {
      if (sandbox.settings.bindings.gamepad.sprint.includes(event.button) && event.gamepad.axes[1] < -.95) utils.weapons.sprint();
    }
  };
  this.onbuttonup = function(event) {
    utils.game.keyUpFunction(event);
    if (sandbox.settings.bindings.gamepad.reload.includes(event.button)) utils.game.keyDownFunction({ code: "KeyR", repeat: false });
    if (sandbox.settings.bindings.gamepad.interact.includes(event.button)) _this.data.interactButtonTime = null;
  };
  this.updateLooking = function(clockDelta, gamepad, vehicle) {
    if (deathScreen) return;
    let weapon = utils.weapons.getCurrentEntry();
    let lookX = gamepad.axes[2];
    let lookY = gamepad.axes[3];
    let threshold = .4;
    let looking = false;
    if (vehicle && vehicle.currentView == 0) vehicle.physicsVariables.heading = Math.max(Math.min(camera.rotation.y * 1.5, vehicle.physicsVariables.maxHeading), -vehicle.physicsVariables.maxHeading);
    if (Math.abs(lookX) > threshold || Math.abs(lookY) > threshold) {
      looking = true;
      if (_this.data.lookDelta <= 0) _this.data.lookDelta = .4 * (_this.lookSpeed / 5);
      _this.data.lookDelta = Math.min(_this.data.lookDelta + _this.lookSensitivity * clockDelta, _this.lookSpeed / 4.2);
      let rotationFactor = _this.data.lookDelta * Math.max(Math.min(_this.data.autoLockPoint ? 10 / _this.data.autoLockPoint.distance : 1, 1), .6);
      let rotationFactorX = rotationFactor * lookX;
      let rotationFactorY = rotationFactor * lookY * .65;
      let isAiming = utils.options.get("Aiming");
      let lookDeltaX = Math.min(Math.pow(Math.abs(rotationFactorX), 2), _this.lookSpeed / 2) * (rotationFactorX < 0 ? -1 : 1) * PointerControls.pointerSpeed * (isAiming ? .8 : 1) * (_this.data.autoLockPoint ? .6 : 1) * (vehicle ? .25 : 1) * clockDelta;
      let lookDeltaY = Math.min(Math.pow(Math.abs(rotationFactorY), 1.7), _this.lookSpeed / 2) * (rotationFactorY < 0 ? -1 : 1) * PointerControls.pointerSpeed * (isAiming ? .7 : 1) * (_this.data.autoLockPoint ? .6 : 1) * (vehicle ? .25 : 1) * clockDelta;
      camera.rotation.y -= lookDeltaX;
      camera.rotation.x -= lookDeltaY;
      if (vehicle && vehicle.currentView == 1) vehicle.physicsVariables.heading = Math.max(Math.min(vehicle.physicsVariables.heading - (lookX / 120), vehicle.physicsVariables.maxHeading), -vehicle.physicsVariables.maxHeading);
    } else {
      _this.data.lookDelta = 0;
    }
    const raycaster = utils.options.get("aimRaycaster");
    raycaster.setFromCamera(vectors[37], camera);
    const intersects = raycaster.intersectObjects(utils.players.autoLockBoxes);
    if (intersects.length > 0) {
      utils.options.set("AllowAimUpdate", true);
      if (intersects.distance < 20 && (looking || (!_this.data.autoLockPoint && utils.options.get("Walking")))) _this.data.autoLockPoint = intersects[0];
    } else {
      if (utils.options.get("Aiming")) {
        utils.weapons.updateAim(weapon);
      } else {
        utils.options.set("AllowAimUpdate", false);
        if (utils.options.get("Walking")) _this.data.autoLockPoint = null;
      }
    }
    if (_this.data.autoLockPoint && (utils.options.get("Walking") || utils.options.get("Jumping")) && _this.data.autoLockPoint.distance > 1.5) {
      let autoLockPosition = utils.players.objects[_this.data.autoLockPoint.object.playerUUID].scene.position.clone();
      autoLockPosition.y += .8;
      vectors[16].setFromRotationMatrix(vectors[36].lookAt(camera.position, autoLockPosition, camera.up));
      camera.quaternion.slerp(vectors[16], Math.min(.003 * (4 / _this.data.autoLockPoint.distance), .003));
    }
  };
  this.updateWalking = function(deltaTime, gamepad, vehicle, walkSpeed) {
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
  };
  for (let i = 0; i < this.buttonMappings.length; i++) {
    let button = this.buttonMappings[i];
    let buttonBinded = false;
    for (action in sandbox.settings.bindings.gamepad) {
      let bindings = sandbox.settings.bindings.gamepad[action];
      if (bindings.indexOf(button) > -1) {
        buttonBinded = true;
        this.buttonKeyMappings[i] = sandbox.settings.bindings.keyboard[action][0];
      }
    }
    if (!buttonBinded) this.buttonKeyMappings[i] = null;
  }
};
TouchScreenControls = function() {
  this.isLocked = true;
  this.speed = .6;
  let previousTouch = null;

  let movementTouchArea = document.querySelector(".mobile-ui .movement-touch-area");
  let lookTouchArea = document.querySelector(".mobile-ui .look-touch-area");

  let movementNode = document.querySelector(".mobile-ui .movement-node");
  let fireWeaponNode = document.querySelector(".mobile-ui .fire-weapon-node");
  let jumpNode = document.querySelector(".mobile-ui .jump-node");
  
  let movementStick = document.querySelector(".mobile-ui .movement-stick");
  let movementStickThumb = document.querySelector(".mobile-ui-movement-stick-thumb");
  let movementStickTouchStartEvent = null;
  let walkVector = new THREE.Vector2();
  let run = false;
  let fire = false;
  let stoppedFiring = true;

  /* --- START LEFT UI FUNCTIONALITY --- */
  function movementEvent(event) {
    if (!utils.options.get("Walking")) utils.weapons.startWalking();
    const touch = Object.values(event.touches).filter(touch => touch.target == movementTouchArea)[0];
    let movementNodeRect = movementNode.getBoundingClientRect();
    movementStick.style = "display:none";
    movementStickThumb.style = `display:block;left:${touch.pageX - 40}px;top:${touch.pageY - 40}px`;
    let powerX = Math.max(-(touch.pageY - (movementNodeRect.top + (movementNodeRect.height / 2))) / 100, -1);
    let powerY = Math.max(Math.min((touch.pageX - (movementNodeRect.left + (movementNodeRect.width / 2))) / 100, 1), -1);
    if (powerX >= 1.8) {
      run = true;
      powerY = 0;
    } else {
      run = false;
    }
    powerX = Math.min(powerX, 1);
    if (Math.abs(powerY) < .3) powerY = 0;
    walkVector.set(powerX, powerY);
  }
  function stopMovementEvent() {
    if (utils.options.get("Walking")) utils.weapons.stopWalking();
    movementStick.style = "";
    movementStickThumb.style = "";
    walkVector.set(0, 0);
    run = false;
  }
  movementTouchArea.addEventListener("touchstart", function(event) {
    movementStickTouchStartEvent = event;
    movementEvent(event);
  });
  movementTouchArea.addEventListener("touchmove", movementEvent);
  movementTouchArea.addEventListener("touchend", stopMovementEvent);
  movementTouchArea.addEventListener("touchcancel", stopMovementEvent);
  /* --- END LEFT UI FUNCTIONALITY --- */

  /* --- START RIGHT UI FUNCTIONALITY --- */
  function fireWeaponEvent() {
    fireWeaponNode.style = "transform:scale(.7)";
    utils.weapons.zoom(false, function() {
      fire = true;
    });
  }
  function stopFireWeaponEvent() {
    fireWeaponNode.style = "";
    utils.weapons.stopZoom();
    fire = false;
  }
  function jumpEvent() {
    jumpNode.style = "transform:scale(.7)";
    utils.weapons.jump();
  }
  function stopJumpEvent() {
    jumpNode.style = "";
  }
  lookTouchArea.addEventListener("touchmove", (event) => {
    if (!this.isLocked) return;
    const touch = Object.values(event.touches).filter(touch => lookTouchArea.contains(touch.target))[0];
    if (previousTouch) {
      camera.rotation.y -= (touch.pageX - previousTouch.pageX) / (120 / this.speed);
      camera.rotation.x -= (touch.pageY - previousTouch.pageY) / (120 / this.speed);
    }
    previousTouch = touch;
  });
  lookTouchArea.addEventListener("touchstart", (event) => {
    event.preventDefault();
  });
  lookTouchArea.addEventListener("touchend", (event) => {
    event.preventDefault();
    previousTouch = null;
  });
  lookTouchArea.addEventListener("touchcancel", (event) => {
    event.preventDefault();
  });
  fireWeaponNode.addEventListener("touchstart", fireWeaponEvent);
  fireWeaponNode.addEventListener("touchend", stopFireWeaponEvent);
  fireWeaponNode.addEventListener("touchcancel", stopFireWeaponEvent);
  jumpNode.addEventListener("touchstart", jumpEvent);
  jumpNode.addEventListener("touchend", stopJumpEvent);
  jumpNode.addEventListener("touchcancel", stopJumpEvent);
  /* --- END RIGHT UI FUNCTIONALITY --- */

  let _this = this;
  this.update = function(deltaTime, time, walkSpeed) {
    if (utils.options.get("MobileGame")) {
      let weapon = utils.weapons.getCurrentEntry();
      _this.isLocked = PointerControls.isLocked;
      _this.speed = PointerControls.pointerSpeed;
      playerVelocity.add(utils.physics.getCameraForwardVector().multiplyScalar(walkVector.x * walkSpeed));
      playerVelocity.add(utils.physics.getCameraSideVector().multiplyScalar(walkVector.y * walkSpeed));
      if (run) {
        if (!utils.options.get("Zoomed") && !utils.options.get("Jumping") && !utils.options.get("Reloading") && playerOnFloor) utils.weapons.sprint();
      } else {
        utils.weapons.stopSprint();
      }
      if (fire) {
        stoppedFiring = false;
        if (typeof weapon.lastShot === "undefined") weapon.lastShot = null;
        if (time - weapon.lastShot >= weapon.defaultDelayBetweenShots) {
          utils.weapons.fire();
        }
      } else {
        if (!stoppedFiring) {
          stoppedFiring = true;
          utils.weapons.stopFire();
        }
      }
    }
  };
};
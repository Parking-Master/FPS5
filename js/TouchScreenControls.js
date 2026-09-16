TouchScreenControls = function() {
  let _this = this;
  _this.initialize = function(container) {
    _this.isLocked = true;
    _this.speed = .6;
    let stylesheet = document.createElement("style");
    stylesheet.innerHTML = '.mobile-ui{position:absolute;width:100%;height:100%;top:0;z-index:2147483645}.mobile-ui .look-touch-area,.mobile-ui .movement-touch-area{position:absolute;width:50%;height:100%;top:0;bottom:0}.mobile-ui .movement-touch-area *{pointer-events:none !important}.mobile-ui .movement-touch-area{left:0}.mobile-ui .look-touch-area{right:0}.mobile-ui .movement-touch-area *{pointer-events:none !important}.mobile-ui .movement-node{position:absolute;width:150px;height:150px;left:50px;bottom:50px;border-radius:100%;border:3px solid rgba(80, 80, 80, 0.3);box-sizing:border-box;background-image:url("/images/ui/mobile-ui/movement-node.png");background-color:rgba(50, 50, 50, 0.6);background-size:100%;background-position:center;display:flex;justify-content:center;align-items:center}.mobile-ui .movement-node .movement-stick{position:relative;padding:30px;background:rgba(20, 20, 20, 0.5);border:3px solid rgba(80, 80, 80, 0.6);border-radius:100%}.mobile-ui-movement-stick-thumb{position:absolute;padding:40px;background:rgba(80, 80, 80, 0.8);border-radius:100%;z-index:2147483645;display:none}.mobile-ui .look-touch-area div{position:absolute;border-radius:100%;border:3px solid rgba(80, 80, 80, 0.3);box-sizing:border-box;background-color:rgba(30, 30, 30, 0.7);background-size:100%;background-position:center}.mobile-ui .fire-weapon-node{width:120px;height:120px;right:50px;bottom:70px;background-image:url("/images/ui/mobile-ui/fire-weapon-node.png")}.mobile-ui .reload-weapon-node{width:50px;height:50px;right:120px;bottom:10px;background-image:url("/images/ui/mobile-ui/reload-weapon-node.png")}.mobile-ui .zoom-weapon-node{width:60px;height:60px;right:120px;bottom:200px;background-image:url("/images/ui/mobile-ui/zoom-weapon-node.png")}.mobile-ui .jump-node{width:60px;height:60px;right:20px;bottom:200px;background-image:url("/images/ui/mobile-ui/jump-node.png")}.mobile-ui .crouch-node{width:50px;height:50px;right:30px;bottom:10px;background-image:url("/images/ui/mobile-ui/crouch-node.png")}.mobile-ui .throw-grenade-node{width:50px;height:50px;right:180px;bottom:140px;background-image:url("/images/ui/mobile-ui/throw-grenade-node.png")}.mobile-ui .switch-weapon-node{width:50px;height:50px;right:20px;bottom:280px;background-image:url("/images/ui/mobile-ui/switch-weapon-node.png")}.mobile-ui .interact-node{width:100px;height:100px;right:250px;bottom:250px;background-image:url("/images/ui/mobile-ui/interact-node.png")}';
    document.querySelector("head").appendChild(stylesheet);
    let mobileUI = document.createElement("div");
    mobileUI.className = "mobile-ui";
    mobileUI.innerHTML = '<div class="movement-touch-area"><div class="movement-node"><div class="movement-stick"></div></div></div><div class="look-touch-area"><div class="fire-weapon-node" data-node="fire-weapon"></div><div class="reload-weapon-node" data-node="reload-weapon"></div><div class="zoom-weapon-node" data-node="zoom-weapon"></div><div class="throw-grenade-node" data-node="throw-grenade"></div><div class="switch-weapon-node" data-node="switch-weapon"></div><div class="jump-node" data-node="jump"></div><div class="crouch-node" data-node="crouch"></div><div class="interact-node" data-node="interact"></div></div>';
    container.appendChild(mobileUI);
    let movementStickThumb = document.createElement("div");
    movementStickThumb.className = "mobile-ui-movement-stick-thumb";
    document.body.appendChild(movementStickThumb);
    let previousTouch = null;
    let movementTouchArea = mobileUI.querySelector(".movement-touch-area");
    let lookTouchArea = mobileUI.querySelector(".look-touch-area");
    let movementNode = mobileUI.querySelector(".movement-node");
    let interactNode = mobileUI.querySelector(".interact-node");
    let movementStick = mobileUI.querySelector(".movement-stick");
    let movementStickTouchStartEvent = null;
    let walkVector = new THREE.Vector2();
    let run = false;
    let fire = false;
    let stoppedFiring = true;
    let manualZoom = false;
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
    function nodePress(event) {
      event.target.style = "transform:scale(.7)";
      if (event.target.dataset.node == "fire-weapon") {
        if (manualZoom) {
          fire = true;
        } else {
          utils.weapons.zoom(false, function() {
            fire = true;
          });
        }
      } else if (event.target.dataset.node == "reload-weapon") {
        utils.weapons.reload();
      } else if (event.target.dataset.node == "zoom-weapon") {
        if (utils.options.get("Zoomed")) {
          utils.weapons.stopZoom();
        } else {
          utils.weapons.zoom();
          manualZoom = true;
        }
      } else if (event.target.dataset.node == "throw-grenade") {
        utils.grenades.throw();
      } else if (event.target.dataset.node == "switch-weapon") {
        fire = false;
        utils.weapons.switch();
      } else if (event.target.dataset.node == "jump") {
        utils.weapons.jump();
      } else if (event.target.dataset.node == "crouch") {
        utils.weapons.crouch();
      } else if (event.target.dataset.node == "interact") {
        if (utils.vehicles.check(true)) {
          utils.vehicles.exit();
        } else if (utils.options.get("CurrentVehicleHovering")) {
          utils.vehicles.enter();
        } else if (utils.options.get("CurrentWeaponHovering")) {
          utils.weapons.pickup();
        }
      }
    }
    function nodeRelease(event) {
      if (event.target.dataset.node != "interact") event.target.style = "";
      if (event.target.dataset.node == "fire-weapon") {
        if (!manualZoom) utils.weapons.stopZoom();
        fire = false;
      }
    }
    lookTouchArea.querySelectorAll("div").forEach(node => (node.addEventListener("touchstart", nodePress), node.addEventListener("touchend", nodeRelease), node.addEventListener("touchcancel", nodeRelease)));
    lookTouchArea.addEventListener("touchmove", (event) => {
      if (!_this.isLocked) return;
      const touch = Object.values(event.touches).filter(touch => lookTouchArea.contains(touch.target))[0];
      if (previousTouch) {
        camera.rotation.y -= (touch.pageX - previousTouch.pageX) / (120 / _this.speed);
        camera.rotation.x -= (touch.pageY - previousTouch.pageY) / (120 / _this.speed);
      }
      previousTouch = touch;
    });
    lookTouchArea.addEventListener("touchstart", event => event.preventDefault());
    lookTouchArea.addEventListener("touchend", event => (event.preventDefault(), previousTouch = null));
    lookTouchArea.addEventListener("touchcancel", event => event.preventDefault());
    _this.update = function(time, walkSpeed) {
      let weapon = utils.weapons.getCurrentEntry();
      _this.isLocked = PointerControls.isLocked;
      if (utils.options.get("Zoomed")) {
        _this.speed = .2;
      } else {
        _this.speed = PointerControls.pointerSpeed;
        manualZoom = false;
      }
      playerVelocity.add(utils.physics.getCameraForwardVector().multiplyScalar(walkVector.x * walkSpeed));
      playerVelocity.add(utils.physics.getCameraSideVector().multiplyScalar(walkVector.y * walkSpeed));
      if (run) {
        if (!utils.options.get("Zoomed") && !utils.options.get("Jumping") && !utils.options.get("Reloading") && !utils.options.get("Crouching") && playerOnFloor) utils.weapons.sprint();
      } else {
        utils.weapons.stopSprint();
      }
      if (fire) {
        stoppedFiring = false;
        if (typeof weapon.lastShot === "undefined") weapon.lastShot = null;
        if (time - weapon.lastShot >= weapon.defaultDelayBetweenShots) utils.weapons.fire();
      } else {
        if (!stoppedFiring) {
          stoppedFiring = true;
          utils.weapons.stopFire();
        }
      }
      if (utils.options.get("CurrentWeaponHovering") || utils.options.get("CurrentVehicleHovering") || utils.vehicles.check(true)) {
        if (interactNode.style.display == "none") {
          interactNode.style.display = "";
        }
      } else {
        if (interactNode.style.display != "none") {
          interactNode.style.display = "none";
        }
      }
    };
  };
};
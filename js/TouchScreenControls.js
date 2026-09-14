TouchScreenControls = function(camera, element) {
  this.isLocked = true;
  this.speed = 1;
  let previousTouch = null;
  element.addEventListener("touchmove", (event) => {
    if (!this.isLocked) return;
    const touch = Object.values(event.touches).filter(touch => touch.target == element)[0];
    if (previousTouch) {
      camera.rotation.y -= (touch.pageX - previousTouch.pageX) / (500 / this.speed);
      camera.rotation.x -= (touch.pageY - previousTouch.pageY) / (500 / this.speed);
    }
    previousTouch = touch;
  });
  element.addEventListener("touchstart", (event) => {
    event.preventDefault();
  });
  element.addEventListener("touchend", (event) => {
    event.preventDefault();
    previousTouch = null;
  });
  element.addEventListener("touchcancel", (event) => {
    event.preventDefault();
  });
  this.update = function() {
    if (utils.options.get("MobileGame")) {
      TouchScreenControls.isLocked = PointerControls.isLocked;
    }
  };
  let ui = document.querySelector(".mobile-ui");
  let movementTouchArea = document.querySelector(".mobile-ui .movement-touch-area");
  let movementStick = document.querySelector(".mobile-ui .movement-stick");
  let movementStickTouchStartEvent = null;
  ui.addEventListener("touchstart", function(event) {
    if (event.target == movementTouchArea) {
      movementStickTouchStartEvent = event;
    }
  });
  ui.addEventListener("touchmove", function(event) {
    if (event.target == movementTouchArea) {
      let moveX = event.pageX - movementStickTouchStartEvent.pageX;
      let moveY = event.pageY - movementStickTouchStartEvent.pageY;
      movementStick.style = `margin-left:${moveX}px;margin-top:${moveY}px`;
    }
  });
  ui.addEventListener("touchend", function(event) {
    if (event.target == movementTouchArea) movementStick.style = "";
  });
  ui.addEventListener("touchcancel", function(event) {
    if (event.target == movementTouchArea) movementStick.style = "";
  });
};
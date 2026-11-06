let spaces = {
  "main": {
    "startingElement": "#lobby-button",
    "autoUpdate": true,
    "navElements": [
      {
        "left": ".login-button",
        "right": ".options-button",
        "up": ".login-button",
        "down": ".signup-button"
      },
      {
        "left": ".signup-button",
        "right": ".options-button",
        "up": ".login-button",
        "down": "#lobby-button"
      },
      {
        "left": ".login-button",
        "right": ".options-button",
        "up": ".options-button",
        "down": "#lobby-button"
      },
      {
        "left": ".login-button",
        "right": ".options-button",
        "up": ".signup-button",
        "down": "#preferences-button"
      },
      {
        "left": ".login-button",
        "right": ".options-button",
        "up": "#lobby-button",
        "down": "#chat-button"
      },
      {
        "left": ".login-button",
        "right": ".options-button",
        "up": "#preferences-button",
        "down": "#forge-button"
      },
      {
        "left": ".login-button",
        "right": ".options-button",
        "up": "#chat-button",
        "down": "#help-button"
      },
      {
        "left": ".login-button",
        "right": ".options-button",
        "up": "#forge-button",
        "down": "#help-button"
      }
    ]
  },
  "game": {
    "startingElement": ".pause-menu-option-resume",
    "autoUpdate": false,
    "navElements": [
      {
        "left": ".pause-menu-option-resume",
        "right": ".pause-menu-option-leave-game",
        "up": ".pause-menu-option-resume",
        "down": ".pause-menu-option-resume"
      },
      {
        "left": ".pause-menu-option-resume",
        "right": ".pause-menu-option-settings",
        "up": ".pause-menu-option-leave-game",
        "down": ".pause-menu-option-leave-game"
      },
      {
        "left": ".pause-menu-option-leave-game",
        "right": ".pause-menu-option-report-bug",
        "up": ".pause-menu-option-settings",
        "down": ".pause-menu-option-settings"
      },
      {
        "left": ".pause-menu-option-settings",
        "right": ".pause-menu-option-report-bug",
        "up": ".pause-menu-option-report-bug",
        "down": ".pause-menu-option-report-bug"
      }
    ]
  }
};

GamepadMenuControls = function(space) {
  let _this = this;
  let currentSpace = spaces[space];
  let currentButtonIndex = parseInt(document.querySelector(currentSpace.startingElement).dataset.gamepadIndex);
  let gamepad = null;
  let time = null;
  let cursor = null;
  let keyboard = null;
  let cursorActive = false;
  let cursorAcceleration = 0;
  let cursorX = window.innerWidth / 2;
  let cursorY = window.innerHeight / 2;
  let focusUpdate = false;
  let buttonNavigationRepeats = 0;
  let lastButtonNavigation = null;
  let buttonMappings = ["a", "b", "x", "y", "lb", "rb", "lt", "rt", "back", "start", "l", "r", "up", "down", "left", "right"];
  let buttonRepeats = {};
  let currentKey = [0, 0];
  let previousSelectMenu = null;
  let moved = false;
  let spam = false;
  let spamTimeout = null;
  let lastSpamTimestamp = null;
  let axesNavigationThreshold = .5;
  if (space == "main" && user.loggedIn) {
    currentSpace.navElements[0].down = "#lobby-button";
    currentSpace.navElements[1] = null;
    currentSpace.navElements[3].up = ".login-button";
  }
  let navigationUtils = {
    focus: function() {
      document.querySelector(`[data-gamepad-index="${currentButtonIndex}"]`).style.outline = "2px solid #fff";
      document.querySelector(`[data-gamepad-index="${currentButtonIndex}"]`).style.boxShadow = "inset 0 0 40px rgba(255, 255, 255, .7)";
    },
    blur: function() {
      document.querySelector(`[data-gamepad-index="${currentButtonIndex}"]`).style.outline = "";
      document.querySelector(`[data-gamepad-index="${currentButtonIndex}"]`).style.boxShadow = "";
    },
    click: function() {
      document.querySelector(`[data-gamepad-index="${currentButtonIndex}"]`).click();
    }
  };
  let keyboardUtils = {
    insert: function(character) {
      if (!document.activeElement) return;
      if (character == "delete") {
        let caret = document.activeElement.selectionStart;
        if (typeof document.activeElement.selectionStart === "undefined") caret = document.activeElement.value.length;
        if (!caret || caret < 1) return;
        let toCaret = document.activeElement.value.slice(0, caret - 1);
        let fromCaret = document.activeElement.value.slice(caret, document.activeElement.value.length);
        document.activeElement.value = toCaret + fromCaret;
        document.activeElement.setSelectionRange(caret - 1, caret - 1);
      } else {
        let caret = document.activeElement.selectionStart;
        if (typeof document.activeElement.selectionStart === "undefined") caret = document.activeElement.value.length;
        let toCaret = document.activeElement.value.slice(0, caret);
        let fromCaret = document.activeElement.value.slice(caret, document.activeElement.value.length);
        document.activeElement.value = toCaret + character + fromCaret;
        document.activeElement.setSelectionRange(caret + 1, caret + 1);
      }
    },
    toggleStyle: function(type = null) {
      if (type == null) {
        if (keyboard.dataset.special == "1") {
          type = "0";
        } else {
          type = "1";
        }
      }
      if (type == "0") {
        keyboard.dataset.special = "0";
        keyboard.innerHTML = `
        <div class="gamepad-keyboard-row">
          <div class="gamepad-keyboard-key">q</div>
          <div class="gamepad-keyboard-key">w</div>
          <div class="gamepad-keyboard-key">e</div>
          <div class="gamepad-keyboard-key">r</div>
          <div class="gamepad-keyboard-key">t</div>
          <div class="gamepad-keyboard-key">y</div>
          <div class="gamepad-keyboard-key">u</div>
          <div class="gamepad-keyboard-key">i</div>
          <div class="gamepad-keyboard-key">o</div>
          <div class="gamepad-keyboard-key">p</div>
        </div>
        <div class="gamepad-keyboard-row">
          <div class="gamepad-keyboard-key">a</div>
          <div class="gamepad-keyboard-key">s</div>
          <div class="gamepad-keyboard-key">d</div>
          <div class="gamepad-keyboard-key">f</div>
          <div class="gamepad-keyboard-key">g</div>
          <div class="gamepad-keyboard-key">h</div>
          <div class="gamepad-keyboard-key">j</div>
          <div class="gamepad-keyboard-key">k</div>
          <div class="gamepad-keyboard-key">l</div>
          <div class="gamepad-keyboard-key" id="enter">↵</div>
        </div>
        <div class="gamepad-keyboard-row">
          <div class="gamepad-keyboard-key">z</div>
          <div class="gamepad-keyboard-key">x</div>
          <div class="gamepad-keyboard-key">c</div>
          <div class="gamepad-keyboard-key" id="space">&nbsp;</div>
          <div class="gamepad-keyboard-key">v</div>
          <div class="gamepad-keyboard-key">b</div>
          <div class="gamepad-keyboard-key">n</div>
          <div class="gamepad-keyboard-key">m</div>
          <div class="gamepad-keyboard-key" id="caps-lock" data-value="1">&uparrow;</div>
        </div>
        `;
      } else {
        keyboard.dataset.special = "1";
        keyboard.innerHTML = `
        <div class="gamepad-keyboard-row">
          <div class="gamepad-keyboard-key">1</div>
          <div class="gamepad-keyboard-key">2</div>
          <div class="gamepad-keyboard-key">3</div>
          <div class="gamepad-keyboard-key">4</div>
          <div class="gamepad-keyboard-key">5</div>
          <div class="gamepad-keyboard-key">6</div>
          <div class="gamepad-keyboard-key">7</div>
          <div class="gamepad-keyboard-key">8</div>
          <div class="gamepad-keyboard-key">9</div>
          <div class="gamepad-keyboard-key">0</div>
        </div>
        <div class="gamepad-keyboard-row">
          <div class="gamepad-keyboard-key">!</div>
          <div class="gamepad-keyboard-key">@</div>
          <div class="gamepad-keyboard-key">#</div>
          <div class="gamepad-keyboard-key">$</div>
          <div class="gamepad-keyboard-key">%</div>
          <div class="gamepad-keyboard-key">^</div>
          <div class="gamepad-keyboard-key">&</div>
          <div class="gamepad-keyboard-key">*</div>
          <div class="gamepad-keyboard-key">-</div>
          <div class="gamepad-keyboard-key" id="enter">↵</div>
        </div>
        <div class="gamepad-keyboard-row">
          <div class="gamepad-keyboard-key">+</div>
          <div class="gamepad-keyboard-key">=</div>
          <div class="gamepad-keyboard-key">;</div>
          <div class="gamepad-keyboard-key" id="space">&nbsp;</div>
          <div class="gamepad-keyboard-key">,</div>
          <div class="gamepad-keyboard-key">.</div>
          <div class="gamepad-keyboard-key">_</div>
          <div class="gamepad-keyboard-key">/</div>
          <div class="gamepad-keyboard-key" id="caps-lock" data-value="1">&uparrow;</div>
        </div>
        `;
      }
      let key = document.querySelectorAll(".gamepad-keyboard-row")[currentKey[0]].querySelectorAll(".gamepad-keyboard-key")[currentKey[1]];
      keyboard.style.display = "block";
      key.classList.add("selected");
    },
    enterKey: function() {
      document.activeElement.blur();
    },
    update: function(moveX, moveY) {
      if (_this.keyboardLock) {
        if (Math.abs(moveX) > .2 || Math.abs(moveY) > .2) {
          if (moved && !spam) return;
          if (!spam) spamTimeout = setTimeout(() => spam = true, 500);
          moved = true;
          if (spam) {
            if (time - lastSpamTimestamp < 100) return;
            lastSpamTimestamp = time;
          }
          function move(direction) {
            if (direction == "right") {
              currentKey[1]++;
              if (currentKey[1] > 9) currentKey[1] = 9;
            }
            if (direction == "left") {
              currentKey[1]--;
              if (currentKey[1] < 0) currentKey[1] = 0;
            }
            if (direction == "down") {
              let oldKey = currentKey[0];
              currentKey[0]++;
              if (currentKey[0] > 2) currentKey[0] = 2;
              if (currentKey[0] == 2 && currentKey[1] > 3 && oldKey != currentKey[0]) currentKey[1]--;
            }
            if (direction == "up") {
              currentKey[0]--;
              if (currentKey[0] < 0) currentKey[0] = 0;
              if (currentKey[0] == 1 && currentKey[1] > 3) currentKey[1]++;
              if (currentKey[0] == 2 && currentKey[1] > 3) currentKey[1]--;
            }
            let key = document.querySelectorAll(".gamepad-keyboard-row")[currentKey[0]].querySelectorAll(".gamepad-keyboard-key")[currentKey[1]];
            if (key) {
              if (document.querySelector(".gamepad-keyboard-key.selected")) document.querySelectorAll(".gamepad-keyboard-key.selected").forEach(x => x.classList.remove("selected"));
              key.classList.add("selected");
            }
          }
          if (moveX > 0.2) {
            move("right");
          } else if (moveX < -0.2) {
            move("left");
          } else if (moveY > 0.2) {
            move("down");
          } else if (moveY < -0.2) {
            move("up");
          }
        } else {
          clearTimeout(spamTimeout);
          moved = false;
          spam = false;
        }
      }
      if (document.activeElement && document.activeElement.tagName == "INPUT" && /\b(text|email|password|number)\b/i.test(document.activeElement.type)) {
        if (!_this.keyboardLock) {
          if (document.querySelector(".gamepad-keyboard-key.selected")) document.querySelectorAll(".gamepad-keyboard-key.selected").forEach(x => x.classList.remove("selected"));
          let key = document.querySelectorAll(".gamepad-keyboard-row")[currentKey[0]].querySelectorAll(".gamepad-keyboard-key")[currentKey[1]];
          keyboard.style.display = "block";
          if (document.activeElement.dataset.gamepadNumberkeys) keyboardUtils.toggleStyle("1");
          key.classList.add("selected");
        }
        _this.keyboardLock = true;
        _this.hideCursor();
      } else if (document.activeElement && document.activeElement.tagName == "SELECT") {
        let selectMenu = document.activeElement;
        previousSelectMenu = selectMenu;
        selectMenu.size = selectMenu.length;
      } else {
        keyboard.style.display = "";
        if (previousSelectMenu && previousSelectMenu.size != 0) previousSelectMenu.size = 0;
        _this.keyboardLock = false;
        _this.showCursor();
      }
    }
  };
  let gamepadUtils = {
    init: function() {
      document.head.innerHTML += `
      <style>
      .gamepad-cursor {
        position: fixed;
        box-sizing: border-box;
        width: 20px;
        height: 20px;
        border: 5px solid #5aace1;
        box-shadow: inset 0 0 10px #fff, 0 0 10px rgba(125, 195, 241, 0.5);
        z-index: 9999999999;
        left: 50%;
        top: 50%;
        margin-left: -10px;
        margin-top: -10px;
        pointer-events: none !important;
        border-radius: 100%;
        display: none;
      }
      .gamepad-keyboard {
        position: fixed;
        background: #f7f7f7;
        border: .5px solid #000;
        border-radius: 10px;
        padding: 6px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999999999;
        top: 30px;
        display: none;
        box-shadow: 0 11px 34px 0 rgba(120, 120, 128, 0.1);
      }
      .gamepad-keyboard::after {
        content: "Use [X] to delete, [B] to exit keyboard.";
        position: absolute;
        bottom: 0;
        margin-bottom: -20px;
        font-size: 12px;
        color: #eee;
        left: 0;
        text-align: left;
        text-shadow: 1px 1px #333;
        opacity: .5;
      }
      .gamepad-keyboard-key {
        position: relative;
        padding: 3px;
        width: 20px;
        height: 20px;
        font-size: 12px;
        background: #fff;
        text-align: center;
        border-radius: 4px;
        box-shadow: 0 4px 10px 0 rgba(120, 120, 128, 0.1);
        display: inline-block;
        margin: 2px 0;
        line-height: 20px;
      }
      .gamepad-keyboard-key#enter {
        font-size: 18px;
      }
      .gamepad-keyboard-key#space {
        width: 50px;
      }
      .gamepad-keyboard-key.selected {
        background: #ddd;
      }
      .gamepad-hovering {
        background: #aaa !important;
      }
      </style>
      `;
      keyboard = document.createElement("div");
      keyboard.className = "gamepad-keyboard";
      keyboard.dataset.special = "0";
      keyboard.innerHTML += `
      <div class="gamepad-keyboard-row">
        <div class="gamepad-keyboard-key">q</div>
        <div class="gamepad-keyboard-key">w</div>
        <div class="gamepad-keyboard-key">e</div>
        <div class="gamepad-keyboard-key">r</div>
        <div class="gamepad-keyboard-key">t</div>
        <div class="gamepad-keyboard-key">y</div>
        <div class="gamepad-keyboard-key">u</div>
        <div class="gamepad-keyboard-key">i</div>
        <div class="gamepad-keyboard-key">o</div>
        <div class="gamepad-keyboard-key">p</div>
      </div>
      <div class="gamepad-keyboard-row">
        <div class="gamepad-keyboard-key">a</div>
        <div class="gamepad-keyboard-key">s</div>
        <div class="gamepad-keyboard-key">d</div>
        <div class="gamepad-keyboard-key">f</div>
        <div class="gamepad-keyboard-key">g</div>
        <div class="gamepad-keyboard-key">h</div>
        <div class="gamepad-keyboard-key">j</div>
        <div class="gamepad-keyboard-key">k</div>
        <div class="gamepad-keyboard-key">l</div>
        <div class="gamepad-keyboard-key" id="enter">↵</div>
      </div>
      <div class="gamepad-keyboard-row">
        <div class="gamepad-keyboard-key">z</div>
        <div class="gamepad-keyboard-key">x</div>
        <div class="gamepad-keyboard-key">c</div>
        <div class="gamepad-keyboard-key" id="space">&nbsp;</div>
        <div class="gamepad-keyboard-key">v</div>
        <div class="gamepad-keyboard-key">b</div>
        <div class="gamepad-keyboard-key">n</div>
        <div class="gamepad-keyboard-key">m</div>
        <div class="gamepad-keyboard-key" id="caps-lock" data-value="1">&uparrow;</div>
      </div>
      `;
      cursor = document.createElement("div");
      cursor.className = "gamepad-cursor";
      document.body.appendChild(keyboard);
      document.body.appendChild(cursor);
      navigationUtils.focus();
    },
    buttonPress: function(event) {
      if (!event.repeat) {
        let notiflixReportButton = document.querySelector(".notiflix-report-button");
        let notiflixCancelButton = document.querySelector(".nx-confirm-button-cancel");
        let notiflixOkButton = document.querySelector(".nx-confirm-button-ok");
        if (event.button == "a") {
          if (_this.keyboardLock) {
            let doInsert = true;
            let key = null;
            let keyElement = document.querySelector(".gamepad-keyboard-key.selected");
            key = keyElement.textContent;
            if (keyElement.id) {
              if (keyElement.id == "space") {
                key = " ";
              } else if (keyElement.id == "caps-lock") {
                doInsert = false;
                if (keyElement.dataset.value == "0") {
                  keyElement.dataset.value = "1";
                  document.querySelectorAll(".gamepad-keyboard-key").forEach(x => x.textContent = x.textContent.toLowerCase());
                } else {
                  keyElement.dataset.value = "0";
                  document.querySelectorAll(".gamepad-keyboard-key").forEach(x => x.textContent = x.textContent.toUpperCase());
                }
              } else if (keyElement.id == "enter") {
                doInsert = false;
                keyboardUtils.enterKey();
              }
            }
            if (doInsert) keyboardUtils.insert(key);
          } else {
            if (cursorActive && _this.elementHovering) {
              _this.elementHovering.focus();
              _this.elementHovering.click();
              if (_this.elementHovering.tagName == "OPTION") {
                _this.elementHovering.parentElement.value = _this.elementHovering.value;
                _this.elementHovering.parentElement.blur();
                if (typeof _this.elementHovering.parentElement.onchange == "function") _this.elementHovering.parentElement.onchange();
              }
            } else if (notiflixReportButton) {
              notiflixReportButton.click();
            } else {
              navigationUtils.click();
            }
          }
        } else if (event.button == "b") {
          if (_this.keyboardLock) {
            keyboardUtils.enterKey();
          } else if (notiflixReportButton) {
            notiflixReportButton.click();
          } else if (notiflixCancelButton) {
            notiflixCancelButton.click();
          } else if (notiflixOkButton) {
            notiflixOkButton.click();
          } else {
            if (space == "main") {
              closeWindow();
            } else if (space == "game") {
              utils.game.togglePause();
            }
          }
        } else if (event.button == "start") {
          if (_this.keyboardLock) keyboardUtils.enterKey();
          if (notiflixOkButton && notiflixCancelButton) {
            setTimeout(() => notiflixOkButton.click(), 100);
          } else {
            if (space == "game") utils.game.togglePause();
          }
        } else if (event.button == "lt" || event.button == "rt") {
          if (_this.keyboardLock) keyboardUtils.toggleStyle();
        } else if (event.button == "x") {
          if (_this.keyboardLock) keyboardUtils.insert("delete");
        } else if (event.button == "y") {
          if (_this.keyboardLock) keyboardUtils.insert(" ");
        } else if (event.button == "lb") {
          if (_this.keyboardLock) {
            let caret = document.activeElement.selectionStart;
            document.activeElement.setSelectionRange(caret - 1, caret - 1);
            document.activeElement.focus();
          }
        } else if (event.button == "rb") {
          if (_this.keyboardLock) {
            let caret = document.activeElement.selectionStart;
            document.activeElement.setSelectionRange(caret + 1, caret + 1);
            document.activeElement.focus();
          }
        }
      }
    },
    updateDialogButtons: function() {
      let notiflixCancelButton = document.querySelector(".nx-confirm-button-cancel");
      let notiflixOkButton = document.querySelector(".nx-confirm-button-ok");
      if (notiflixCancelButton && notiflixOkButton) {
        if (!notiflixOkButton.classList.contains("gamepad-start-icon-button")) {
          notiflixOkButton.classList.remove("gamepad-b-icon-button");
          notiflixOkButton.classList.add("gamepad-start-icon-button");
          notiflixOkButton.innerHTML += `<img src="/images/assets/gamepad-buttons/start.png">`;
        }
        if (!notiflixCancelButton.classList.contains("gamepad-b-icon-button")) {
          notiflixCancelButton.classList.remove("gamepad-start-icon-button");
          notiflixCancelButton.classList.add("gamepad-b-icon-button");
          notiflixCancelButton.innerHTML += `<img src="/images/assets/gamepad-buttons/b.png">`;
        }
      } else if (notiflixOkButton) {
        if (!notiflixOkButton.classList.contains("gamepad-b-icon-button")) {
          notiflixOkButton.classList.remove("gamepad-start-icon-button");
          notiflixOkButton.classList.add("gamepad-b-icon-button");
          notiflixOkButton.innerHTML += `<img src="/images/assets/gamepad-buttons/b.png">`;
        }
      }
    },
    updateButtons: function() {
      for (i in gamepad.buttons) {
        if (gamepad.buttons[i].pressed) {
          gamepadUtils.buttonPress({
            button: buttonMappings[i],
            repeat: buttonRepeats[buttonMappings[i]]
          });
          buttonRepeats[buttonMappings[i]] = true;
        } else {
          buttonRepeats[buttonMappings[i]] = false;
        }
      }
    },
    updateCursor: function() {
      let moveX = gamepad.axes[0];
      let moveY = gamepad.axes[1];
      gamepadUtils.updateDialogButtons();
      keyboardUtils.update(moveX, moveY);
      if (!_this.keyboardLock) {
        if (Math.abs(moveY) < axesNavigationThreshold && Math.abs(moveX) < axesNavigationThreshold) {
          cursorAcceleration = 0;
        } else {
          cursorAcceleration = Math.min(cursorAcceleration + 0.015, 1);
          cursorX = Math.max(0, Math.min(cursorX + (moveX * cursorAcceleration * 25), window.innerWidth));
          cursorY = Math.max(0, Math.min(cursorY + (moveY * cursorAcceleration * 25), window.innerHeight));
          cursor.style.left = `${cursorX}px`;
          cursor.style.top = `${cursorY}px`;
        }
        if (_this.elementHovering && _this.elementHovering.classList.contains("gamepad-hovering")) _this.elementHovering.classList.remove("gamepad-hovering");
        _this.elementHovering = document.elementFromPoint(cursorX, cursorY);
        if (_this.elementHovering && /\b(select|option|input|button)\b/i.test(_this.elementHovering.tagName)) _this.elementHovering.classList.add("gamepad-hovering");
        let scrollY = gamepad.axes[3];
        if (Math.abs(scrollY) > .1) {
          let scrollableElements = document.querySelectorAll("[data-gamepad-scrollable]");
          for (let i = 0; i < scrollableElements.length; i++) {
            if (scrollableElements[i].contains(_this.elementHovering)) {
              scrollableElements[i].scrollTop += scrollY * 10;
            }
          }
        }
      }
    },
    updateNavigation: function() {
      let delay = buttonNavigationRepeats == 1 ? 400 : 150;
      if (time - lastButtonNavigation >= delay) {
        if (gamepad.axes[0] < -axesNavigationThreshold) {
          navigationUtils.blur();
          currentButtonIndex = parseInt(document.querySelector(currentSpace.navElements[currentButtonIndex].left).dataset.gamepadIndex);
          focusUpdate = true;
          buttonNavigationRepeats++;
          lastButtonNavigation = time;
        }
        if (gamepad.axes[0] > axesNavigationThreshold) {
          navigationUtils.blur();
          currentButtonIndex = parseInt(document.querySelector(currentSpace.navElements[currentButtonIndex].right).dataset.gamepadIndex);
          focusUpdate = true;
          buttonNavigationRepeats++;
          lastButtonNavigation = time;
        }
        if (gamepad.axes[1] < -axesNavigationThreshold) {
          navigationUtils.blur();
          currentButtonIndex = parseInt(document.querySelector(currentSpace.navElements[currentButtonIndex].up).dataset.gamepadIndex);
          focusUpdate = true;
          buttonNavigationRepeats++;
          lastButtonNavigation = time;
        }
        if (gamepad.axes[1] > axesNavigationThreshold) {
          navigationUtils.blur();
          currentButtonIndex = parseInt(document.querySelector(currentSpace.navElements[currentButtonIndex].down).dataset.gamepadIndex);
          focusUpdate = true;
          buttonNavigationRepeats++;
          lastButtonNavigation = time;
        }
        if (Math.abs(gamepad.axes[0]) < axesNavigationThreshold && Math.abs(gamepad.axes[1]) < axesNavigationThreshold) {
          buttonNavigationRepeats = 0;
          lastButtonNavigation = null;
        }
      }
    }
  };
  _this.connected = false;
  _this.elementHovering = null;
  _this.enableCursor = function() {
    if (!_this.connected) return;
    cursor.style.display = "block";
    cursor.style.opacity = "1";
    cursorActive = true;
  };
  _this.disableCursor = function() {
    if (!_this.connected) return;
    cursor.style.display = "none";
    cursorActive = false;
  };
  _this.showCursor = function() {
    cursor.style.opacity = "1";
  };
  _this.hideCursor = function() {
    cursor.style.opacity = "0";
  };
  _this.update = function() {
    let gamepads = navigator.getGamepads();
    if (gamepads.length > 0 && gamepads[0] != null) {
      if (_this.connected) {
        gamepad = gamepads[0];
        time = Date.now();
        if (focusUpdate) focusUpdate = false, navigationUtils.focus();
        gamepadUtils.updateButtons();
        if (cursorActive) {
          gamepadUtils.updateCursor();
        } else {
          gamepadUtils.updateNavigation();
        }
      } else {
        _this.connected = true;
        gamepadUtils.init();
      }
    }
    if (currentSpace.autoUpdate) requestAnimationFrame(_this.update);
    if (_this.connected) return true;
    return false;
  }
  _this.update();
}
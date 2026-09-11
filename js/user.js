function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  let expires = "expires="+d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
function getCookie(cname) {
  let name = cname + "=";
  let ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}
function deleteAllCookies() {
  let cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    let eqPos = cookie.indexOf("=");
    let name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
}

user = {
  serverURL: "https://parkingmaster-cloud.serveousercontent.com/FPS5",
  data: null,
  loggedIn: false,
  login: function(username, password, callback = () => {}) {
    fetch(user.serverURL + "/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    }).then(function(response) {
      if (response.status == 200) {
        response.text().then(sessionKey => {
          setCookie("s", sessionKey, 30);
          callback(true, 0);
          user.load(function() {
            callback(true, 1);
          });
        });
      } else {
        callback(false, 0);
      }
    }).catch(function() {
      callback(false, 1);
    });
  },
  signup: function(email, username, password, callback = () => {}) {
    fetch(user.serverURL + "/users/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email,
        username: username,
        password: password,
        verificationUrl: location.protocol + "//" + location.host + "/verify.html"
      })
    }).then(function(response) {
      if (response.status == 200) {
        callback(true);
      } else {
        callback(false);
      }
    });
  },
  verify: function(email, verificationKey, callback = () => {}) {
    fetch(user.serverURL + "/users/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email,
        verificationKey: verificationKey
      })
    }).then(function(response) {
      if (response.status == 200) {
        callback(true);
      } else {
        callback(false);
      }
    });
  },
  sendPasswordReset: function(email, callback = () => {}) {
    fetch(user.serverURL + "/users/reset-password-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email,
        verificationUrl: location.protocol + "//" + location.host + "/login.html"
      })
    }).then(function(response) {
      if (response.status == 200) {
        callback(true);
      } else {
        callback(false);
      }
    });
  },
  resetPassword: function(email, verificationKey, newPassword, callback = () => {}) {
    fetch(user.serverURL + "/users/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: email,
        verificationKey: verificationKey,
        newPassword: newPassword
      })
    }).then(function(response) {
      if (response.status == 200) {
        callback(true);
      } else {
        callback(false);
      }
    });
  },
  logout: function() {
    if (user.loggedIn) {
      let sessionKey = getCookie("s");
      fetch(user.serverURL + "/users/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sessionKey: sessionKey
        })
      });
      deleteAllCookies();
      localStorage.removeItem("user-cache");
      user.data = null;
      user.loggedIn = false;
    }
  },
  load: function(callback = () => {}) {
    let sessionKey = getCookie("s");
    if (sessionKey) {
      user.loggedIn = true;
      if (localStorage["user-cache"]) user.data = JSON.parse(localStorage["user-cache"]);
      fetch(user.serverURL + "/users/get/" + sessionKey).then(function(response) {
        if (response.status == 200) {
          response.json().then(function(data) {
            user.data = data;
            localStorage.setItem("user-cache", JSON.stringify(data));
            callback();
          });
        }
      });
    }
  },
  set: function(key, value) {
    user.data[key] = value;
    if (user.loggedIn) {
      let sessionKey = getCookie("s");
      fetch(user.serverURL + "/users/set", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sessionKey: sessionKey,
          key: key,
          value: value
        })
      }).then(function(response) {
        if (response.status == 200) {
          if (localStorage["user-cache"]) {
            let cache = JSON.parse(localStorage["user-cache"]);
            cache[key] = value;
            localStorage.setItem("user-cache", JSON.stringify(cache));
          }
        }
      });
    }
  },
  getLobbies: function(callback = () => {}) {
    fetch(user.serverURL + "/lobbies/get").then(response => response.json()).then(function(lobbies) {
      callback(lobbies);
    });
  },
  createLobby: function(lobbyName, callback = () => {}) {
    fetch(user.serverURL + "/lobbies/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        lobbyName: lobbyName
      })
    }).then(function(response) {
      if (response.status == 200) {
        callback();
      }
    });
  },
  getAllUsers: function(callback = () => {}) {
    fetch(user.serverURL + "/users").then(response => response.json()).then(function(allUsers) {
      callback(allUsers);
    });
  }
};
user.load();
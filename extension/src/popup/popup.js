const $ = (id) => document.getElementById(id);

function showError(msg) {
  $("error").textContent = msg || "";
}

function showLoggedIn(email) {
  $("logged-out").classList.add("hidden");
  $("logged-in").classList.remove("hidden");
  $("user-email").textContent = email;
}

function showLoggedOut() {
  $("logged-out").classList.remove("hidden");
  $("logged-in").classList.add("hidden");
}

$("tab-login").addEventListener("click", () => {
  $("tab-login").classList.add("active");
  $("tab-register").classList.remove("active");
  $("login-form").classList.remove("hidden");
  $("register-form").classList.add("hidden");
});

$("tab-register").addEventListener("click", () => {
  $("tab-register").classList.add("active");
  $("tab-login").classList.remove("active");
  $("register-form").classList.remove("hidden");
  $("login-form").classList.add("hidden");
});

$("login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  showError("");
  chrome.runtime.sendMessage(
    {
      type: "LOGIN",
      email: $("login-email").value,
      password: $("login-password").value,
    },
    (res) => {
      if (res?.error) showError(res.error);
      else showLoggedIn(res.user.email);
    },
  );
});

$("register-form").addEventListener("submit", (e) => {
  e.preventDefault();
  showError("");
  chrome.runtime.sendMessage(
    {
      type: "REGISTER",
      email: $("reg-email").value,
      password: $("reg-password").value,
      name: $("reg-name").value,
    },
    (res) => {
      if (res?.error) showError(res.error);
      else showLoggedIn(res.user.email);
    },
  );
});

$("logout-btn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "LOGOUT" }, () => showLoggedOut());
});

$("save-settings").addEventListener("click", async () => {
  await chrome.storage.local.set({
    apiBaseUrl: $("api-url").value,
    notifications: $("notif-enabled").checked,
  });
  alert("Settings saved");
});

chrome.storage.local.get(["token", "userEmail", "apiBaseUrl", "notifications"], (data) => {
  if (data.token) {
    showLoggedIn(data.userEmail || "User");
    if (data.apiBaseUrl) $("api-url").value = data.apiBaseUrl;
    $("notif-enabled").checked = data.notifications !== false;
  } else {
    showLoggedOut();
  }
});

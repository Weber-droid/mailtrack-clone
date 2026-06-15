const DEFAULT_API = "http://localhost:8000";

async function getSettings() {
  return chrome.storage.local.get([
    "token",
    "apiBaseUrl",
    "trackOpens",
    "trackLinks",
    "notifications",
    "userEmail",
  ]);
}

async function apiRequest(path, options = {}, requireAuth = true) {
  const { token, apiBaseUrl } = await getSettings();
  const base = apiBaseUrl || DEFAULT_API;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (requireAuth && token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${base}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    try {
      if (message.type === "GET_AUTH") {
        const data = await getSettings();
        sendResponse({ token: data.token, userEmail: data.userEmail });
        return;
      }
      if (message.type === "LOGIN") {
        const data = await apiRequest(
          "/api/auth/login",
          {
            method: "POST",
            body: JSON.stringify({ email: message.email, password: message.password }),
          },
          false,
        );
        await chrome.storage.local.set({
          token: data.access_token,
          userEmail: data.user.email,
        });
        sendResponse({ ok: true, user: data.user });
        return;
      }
      if (message.type === "REGISTER") {
        const data = await apiRequest(
          "/api/auth/register",
          {
            method: "POST",
            body: JSON.stringify({
              email: message.email,
              password: message.password,
              name: message.name,
            }),
          },
          false,
        );
        await chrome.storage.local.set({
          token: data.access_token,
          userEmail: data.user.email,
        });
        sendResponse({ ok: true, user: data.user });
        return;
      }
      if (message.type === "LOGOUT") {
        await chrome.storage.local.remove(["token", "userEmail"]);
        sendResponse({ ok: true });
        return;
      }
      if (message.type === "CREATE_TRACKED_EMAIL") {
        const settings = await getSettings();
        if (!settings.token) throw new Error("Not authenticated");
        const data = await apiRequest("/api/emails", {
          method: "POST",
          body: JSON.stringify({
            recipient: message.recipient,
            subject: message.subject,
            links: message.links,
            track_opens: message.trackOpens ?? settings.trackOpens !== false,
            track_links: message.trackLinks ?? settings.trackLinks !== false,
          }),
        });
        await chrome.storage.local.set({
          [`email_${data.email_id}`]: {
            recipient: message.recipient,
            subject: message.subject,
            createdAt: Date.now(),
          },
        });
        sendResponse(data);
        return;
      }
      if (message.type === "GET_EMAIL_STATUS") {
        const data = await apiRequest(`/api/emails/${message.emailId}`);
        sendResponse(data);
        return;
      }
      if (message.type === "LIST_EMAILS") {
        const ids = message.ids.join(",");
        const data = await apiRequest(`/api/emails?ids=${ids}`);
        sendResponse(data);
        return;
      }
      sendResponse({ error: "Unknown message type" });
    } catch (err) {
      sendResponse({ error: err.message });
    }
  })();
  return true;
});

// Poll for new events and show notifications
setInterval(async () => {
  const { token, notifications, apiBaseUrl } = await getSettings();
  if (!token || notifications === false) return;
  try {
    const base = apiBaseUrl || DEFAULT_API;
    const res = await fetch(`${base}/api/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    const lastCheck = (await chrome.storage.local.get("lastEventCheck")).lastEventCheck || 0;
    const newEvents = data.events.filter((e) => new Date(e.timestamp).getTime() > lastCheck);
    if (newEvents.length > 0) {
      const ev = newEvents[0];
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: `Email ${ev.event_type}`,
        message: `${ev.recipient} ${ev.event_type === "open" ? "opened" : "clicked"} your email`,
      });
      await chrome.storage.local.set({ lastEventCheck: Date.now() });
    }
  } catch {
    // ignore poll errors
  }
}, 30000);

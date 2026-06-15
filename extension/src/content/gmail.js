let sending = false;

function getComposeDialog() {
  return document.querySelector('div[role="dialog"]');
}

function getComposeBody(compose) {
  return compose?.querySelector('div[aria-label="Message Body"], div[role="textbox"]');
}

function getRecipient(compose) {
  const toField = compose?.querySelector('input[name="to"], input[aria-label*="To"]');
  if (toField?.value) return toField.value.split(",")[0].trim();
  const chips = compose?.querySelectorAll('span[email]');
  if (chips?.length) return chips[0].getAttribute("email") || chips[0].textContent?.trim();
  return null;
}

function getSubject(compose) {
  const subject = compose?.querySelector('input[name="subjectbox"]');
  return subject?.value || "";
}

function extractLinks(bodyEl) {
  const links = new Set();
  bodyEl.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href");
    if (href?.startsWith("http")) links.add(href);
  });
  const text = bodyEl.innerText || "";
  const urlRegex = /https?:\/\/[^\s<>"']+/g;
  (text.match(urlRegex) || []).forEach((u) => links.add(u));
  return [...links];
}

function injectPixel(bodyEl, pixelHtml) {
  const temp = document.createElement("div");
  temp.innerHTML = pixelHtml;
  const img = temp.querySelector("img");
  if (img) bodyEl.appendChild(img);
}

function rewriteLinks(bodyEl, trackedLinks) {
  bodyEl.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href");
    if (href && trackedLinks[href]) a.setAttribute("href", trackedLinks[href]);
  });
  let html = bodyEl.innerHTML;
  for (const [orig, tracked] of Object.entries(trackedLinks)) {
    html = html.split(orig).join(tracked);
  }
  bodyEl.innerHTML = html;
}

function showAuthBanner() {
  if (document.getElementById("mailtrack-auth-banner")) return;
  const banner = document.createElement("div");
  banner.id = "mailtrack-auth-banner";
  banner.className = "mailtrack-banner";
  banner.textContent = "Sign in to SendBeacon extension to enable tracking";
  document.body.appendChild(banner);
}

async function isAuthenticated() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_AUTH" }, (res) => {
      resolve(!!res?.token);
    });
  });
}

function injectTrackToggles(compose) {
  if (compose.querySelector(".mailtrack-toggles")) return;
  const wrap = document.createElement("div");
  wrap.className = "mailtrack-toggles";
  wrap.innerHTML = `
    <label><input type="checkbox" id="mt-track-opens" checked /> Track opens</label>
    <label><input type="checkbox" id="mt-track-links" checked /> Track links</label>
  `;
  compose.insertBefore(wrap, compose.firstChild);
}

document.addEventListener(
  "click",
  async (e) => {
    const target = e.target.closest('[role="button"], div[aria-label*="Send"]');
    if (!target) return;
    const label = target.getAttribute("aria-label") || target.textContent || "";
    if (!label.toLowerCase().includes("send")) return;

    const compose = getComposeDialog();
    if (!compose) return;

    const authed = await isAuthenticated();
    if (!authed) {
      showAuthBanner();
      return;
    }

    if (sending) return;
    e.preventDefault();
    e.stopPropagation();
    sending = true;

    try {
      const bodyEl = getComposeBody(compose);
      const recipient = getRecipient(compose);
      if (!recipient || !bodyEl) throw new Error("Could not read compose fields");

      const trackOpens = compose.querySelector("#mt-track-opens")?.checked !== false;
      const trackLinks = compose.querySelector("#mt-track-links")?.checked !== false;
      const links = trackLinks ? extractLinks(bodyEl) : [];

      const result = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            type: "CREATE_TRACKED_EMAIL",
            recipient,
            subject: getSubject(compose),
            links,
            trackOpens,
            trackLinks,
          },
          (res) => {
            if (res?.error) reject(new Error(res.error));
            else resolve(res);
          },
        );
      });

      if (trackOpens && result.tracking_pixel) injectPixel(bodyEl, result.tracking_pixel);
      if (trackLinks && result.tracked_links) rewriteLinks(bodyEl, result.tracked_links);

      sending = false;
      target.click();
    } catch (err) {
      sending = false;
      console.error("SendBeacon:", err);
      alert(`SendBeacon error: ${err.message}`);
    }
  },
  true,
);

// Inject toggles when compose opens
const observer = new MutationObserver(() => {
  const compose = getComposeDialog();
  if (compose) injectTrackToggles(compose);
});
observer.observe(document.body, { childList: true, subtree: true });

// Sent folder badges
async function updateSentBadges() {
  const authed = await isAuthenticated();
  if (!authed) return;

  const rows = document.querySelectorAll("tr.zA");
  for (const row of rows) {
    if (row.querySelector(".mailtrack-badge")) continue;
    const subjectEl = row.querySelector("span.bog");
    if (!subjectEl) continue;
    const badge = document.createElement("span");
    badge.className = "mailtrack-badge mailtrack-sent";
    badge.title = "Tracked";
    badge.textContent = " ✓";
    subjectEl.appendChild(badge);
  }
}

setInterval(updateSentBadges, 5000);
updateSentBadges();

/* Public sharing metadata only. WeChat credentials belong on a signing server. */
(() => {
  "use strict";
  const meta = key => document.querySelector(`meta[property="${key}"],meta[name="${key}"]`)?.content || "";
  const data = { title: meta("og:title"), text: meta("og:description"), url: meta("og:url"), image: meta("og:image") };
  const entryUrl = location.href.split("#")[0];
  const root = document.documentElement;
  const dialog = document.getElementById("share-dialog");
  const feedback = document.getElementById("share-feedback");
  const urlInput = document.getElementById("share-url");
  const qqUrl = new URL("https://connect.qq.com/widget/shareqq/index.html");
  for (const [key, value] of Object.entries({ url: data.url, title: data.title, summary: data.text, pics: data.image, site: meta("og:site_name") })) qqUrl.searchParams.set(key, value);
  document.getElementById("share-qq").href = qqUrl.href;
  urlInput.value = data.url;

  function showDialog() {
    feedback.textContent = "";
    if (!dialog.open) dialog.showModal();
  }
  document.getElementById("share-button").addEventListener("click", async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: data.title, text: data.text, url: data.url });
        return;
      } catch (error) {
        if (error.name === "AbortError") return;
      }
    }
    showDialog();
  });
  document.getElementById("share-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  document.getElementById("share-copy").addEventListener("click", async () => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(data.url);
      else {
        urlInput.focus(); urlInput.select();
        if (!document.execCommand("copy")) throw new Error("Copy unavailable");
      }
      feedback.textContent = "链接已复制";
    } catch {
      feedback.textContent = "无法自动复制，请手动复制网站链接";
      urlInput.focus(); urlInput.select();
    }
  });

  function loadSdk(src, available) {
    if (available()) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      const timeout = setTimeout(() => finish(new Error("Share SDK timed out")), 8000);
      function finish(error) {
        clearTimeout(timeout);
        script.onload = script.onerror = null;
        if (error) { script.remove(); reject(error); } else resolve();
      }
      script.src = src; script.async = true;
      script.onload = () => finish(available() ? null : new Error("Share SDK unavailable"));
      script.onerror = () => finish(new Error("Share SDK failed to load"));
      document.head.append(script);
    });
  }

  async function configureQq() {
    if (!/\bQQ\/[\d.]+/i.test(navigator.userAgent) || /MicroMessenger/i.test(navigator.userAgent)) return;
    root.dataset.qqShare = "loading";
    try {
      await loadSdk("https://open.mobile.qq.com/sdk/qqapi.js", () => typeof window.mqq?.data?.setShareInfo === "function");
      window.mqq.data.setShareInfo({ title: data.title, desc: data.text, share_url: data.url, image_url: data.image });
      root.dataset.qqShare = "configured";
    } catch { root.dataset.qqShare = "unavailable"; }
  }
  async function configureWechat() {
    if (!/MicroMessenger/i.test(navigator.userAgent)) return;
    const configuredEndpoint = meta("wechat-signature-endpoint").trim();
    if (!configuredEndpoint) { root.dataset.wechatShare = "unconfigured"; return; }
    root.dataset.wechatShare = "loading";
    try {
      const endpoint = new URL(configuredEndpoint, location.href);
      if (endpoint.protocol !== "https:" && !(endpoint.protocol === "http:" && ["localhost", "127.0.0.1"].includes(endpoint.hostname))) throw new Error("Signing endpoint requires HTTPS");
      endpoint.searchParams.set("url", entryUrl);
      const controller = new AbortController();
      const requestTimeout = setTimeout(() => controller.abort(), 8000);
      let response;
      try { response = await fetch(endpoint, { cache: "no-store", credentials: "omit", signal: controller.signal }); } finally { clearTimeout(requestTimeout); }
      if (!response.ok) throw new Error("Signing service unavailable");
      const signed = await response.json();
      if (!signed || typeof signed.appId !== "string" || !/^wx[a-z0-9]+$/i.test(signed.appId) || !Number.isInteger(signed.timestamp) || signed.timestamp <= 0 || typeof signed.nonceStr !== "string" || !signed.nonceStr || typeof signed.signature !== "string" || !/^[a-f0-9]{40}$/i.test(signed.signature)) throw new Error("Invalid signing response");
      await loadSdk("https://res.wx.qq.com/open/js/jweixin-1.6.0.js", () => typeof window.wx?.config === "function");
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("WeChat share configuration timed out")), 8000);
        const fail = () => { clearTimeout(timeout); reject(new Error("WeChat share configuration failed")); };
        window.wx.error(fail);
        window.wx.ready(() => {
          let complete = 0;
          const success = () => { if (++complete === 2) { clearTimeout(timeout); resolve(); } };
          try {
            window.wx.updateAppMessageShareData({ title: data.title, desc: data.text, link: data.url, imgUrl: data.image, success, fail, cancel: fail });
            window.wx.updateTimelineShareData({ title: data.title, link: data.url, imgUrl: data.image, success, fail, cancel: fail });
          } catch { fail(); }
        });
        try { window.wx.config({ debug: false, appId: signed.appId, timestamp: signed.timestamp, nonceStr: signed.nonceStr, signature: signed.signature, jsApiList: ["updateAppMessageShareData", "updateTimelineShareData"] }); } catch { fail(); }
      });
      root.dataset.wechatShare = "configured";
    } catch { root.dataset.wechatShare = "unavailable"; }
  }
  configureQq();
  configureWechat();
})();

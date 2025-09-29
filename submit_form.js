document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form");
  const result = document.getElementById("result"); // reused as toast container
  const submitBtn = document.getElementById("submitBtn");

  if (!form || !result) return;

  // Toast helper
  let toastTimer = null;
  function showToast(message, type = "info", title = "") {
    // build markup
    result.className = "toast " + type;
    result.innerHTML = `
      <div class="toast-icon" aria-hidden="true">
        ${type === "success" ? "✓" : type === "error" ? "!" : "i"}
      </div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ""}
        <div class="toast-text">${message}</div>
      </div>
      <button class="toast-close" aria-label="Dismiss notification">&times;</button>
    `;
    // show
    result.setAttribute("role", "status");
    result.setAttribute("aria-live", "polite");
    result.classList.add("show");

    // click to close
    const close = result.querySelector(".toast-close");
    close.addEventListener("click", hideToast);

    // auto-dismiss after 5s
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 5000);

    // allow keyboard dismiss (Esc)
    function onKey(e) {
      if (e.key === "Escape") hideToast();
    }
    document.addEventListener("keydown", onKey);

    function hideToast() {
      result.classList.remove("show");
      clearTimeout(toastTimer);
      document.removeEventListener("keydown", onKey);
      // clear contents after animation
      setTimeout(() => {
        result.innerHTML = "";
        result.className = "";
      }, 300);
    }
  }

  // helper to get hCaptcha token (tries FormData first then hcaptcha API)
  function getHCaptchaToken() {
    const fd = new FormData(form);
    const tokenFromField = fd.get("h-captcha-response");
    if (tokenFromField && tokenFromField.toString().trim())
      return tokenFromField.toString();

    if (window.hcaptcha && typeof hcaptcha.getResponse === "function") {
      try {
        const r = hcaptcha.getResponse();
        if (r) return r;
      } catch (e) {
        /* ignore */
      }
    }
    return "";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // AJAX

    // HTML5 validation
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // honeypot check
    const hp = form.querySelector('[name="botcheck"]');
    if (hp && hp.value && hp.value.trim() !== "") {
      showToast("Submission rejected.", "error", "Spam detected");
      return;
    }

    // captcha token check (if your access_key requires captcha)
    const token = getHCaptchaToken();
    if (!token) {
      showToast(
        "Please complete the captcha before submitting.",
        "info",
        "Action required"
      );
      const capWrap = document.getElementById("hcaptchaWrapper");
      if (capWrap)
        capWrap.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // prepare payload
    const formData = new FormData(form);
    formData.set("h-captcha-response", token);
    const payload = Object.fromEntries(formData.entries());

    // UI: sending
    submitBtn.disabled = true;
    submitBtn.setAttribute("aria-busy", "true");
    showToast("Sending…", "info");

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok) {
        showToast(
          "Thanks, message sent! I'll reply soon.",
          "success",
          "Success"
        );
        form.reset();
        if (window.hcaptcha && typeof hcaptcha.reset === "function") {
          try {
            hcaptcha.reset();
          } catch (err) {}
        }
      } else {
        console.error("Web3Forms response", json);
        showToast(
          json?.message || "Sorry — message failed to send.",
          "error",
          "Error"
        );
      }
    } catch (err) {
      console.error("Network / CORS error", err);
      showToast("Network error — please try again later.", "error", "Network");
    } finally {
      submitBtn.disabled = false;
      submitBtn.removeAttribute("aria-busy");
    }
  });
});

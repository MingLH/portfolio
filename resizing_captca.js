(function () {
  const wrapper = document.getElementById("hcaptchaWrapper");
  if (!wrapper) return;

  // native widget size — change if you discover your widget uses other dimensions
  const NATIVE_WIDTH = 302;
  const NATIVE_HEIGHT = 78;

  // function to set scale and wrapper height
  function resizeCaptcha() {
    const containerWidth = wrapper.clientWidth;
    // scale down only (never grow >1)
    const scale = Math.min(1, containerWidth / NATIVE_WIDTH);

    // set transform on the direct element (iframe or h-captcha element)
    // We apply transform to the first child element (the h-captcha container or iframe)
    const inner =
      wrapper.querySelector(".h-captcha") || wrapper.querySelector("iframe");
    if (inner) {
      inner.style.transform = `scale(${scale})`;
      // set wrapper height so it fits the scaled iframe (avoid visual jump)
      wrapper.style.height = `${Math.ceil(NATIVE_HEIGHT * scale)}px`;
    }
  }

  // ResizeObserver to respond to layout changes responsively
  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver(resizeCaptcha);
    ro.observe(wrapper);
  } else {
    // fallback: recalc on window resize
    window.addEventListener("resize", resizeCaptcha, { passive: true });
  }

  // call once now (after a short delay to allow hCaptcha to render)
  // some widgets render asynchronously, so try again after 200ms if needed
  setTimeout(resizeCaptcha, 200);
  setTimeout(resizeCaptcha, 800);
})();

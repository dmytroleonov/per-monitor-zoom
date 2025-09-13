import browser from "webextension-polyfill";
let lastWidth = 0;

function sendMonitorChangeEvent() {
  const currentWidth = window.screen.width;
  if (lastWidth === currentWidth) {
    return;
  }

  lastWidth = currentWidth;
  browser.runtime.sendMessage({
    type: "monitor-change",
    width: currentWidth,
  });
}

window.addEventListener("resize", sendMonitorChangeEvent);
sendMonitorChangeEvent();

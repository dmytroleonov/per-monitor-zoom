import browser from "webextension-polyfill";
import type { MonitorChangeMessage } from "./types";

let lastWidth = 0;
let lastHeight = 0;

function sendMonitorChangeEvent() {
  const { width, height } = window.screen;
  if (lastWidth === width && lastHeight === height) {
    return;
  }

  lastWidth = width;
  lastHeight = height;
  const message: MonitorChangeMessage = {
    type: "monitor-change",
    width,
    height,
  };
  browser.runtime.sendMessage(message);
}

window.addEventListener("resize", sendMonitorChangeEvent);
sendMonitorChangeEvent();

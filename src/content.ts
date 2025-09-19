import browser from "webextension-polyfill";
import type { MonitorChangeMessage, PageLoadMessage } from "./types";

let { width: prevWidth, height: prevHeight } = window.screen;

function sendMonitorChangeEvent() {
  const { width, height } = window.screen;
  if (prevWidth === width && prevHeight === height) {
    return;
  }

  prevWidth = width;
  prevHeight = height;
  const message: MonitorChangeMessage = {
    type: "monitor-change",
    width,
    height,
  };
  browser.runtime.sendMessage(message);
}

function sendPageLoadMessage() {
  const message: PageLoadMessage = {
    type: "page-load",
    width: prevWidth,
    height: prevHeight,
  };
  browser.runtime.sendMessage(message);
}

window.addEventListener("resize", sendMonitorChangeEvent);
sendPageLoadMessage();

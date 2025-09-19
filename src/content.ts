import browser from "webextension-polyfill";
import type {
  MonitorChangeMessage,
  MonitorKeyMessage,
  PageLoadMessage,
  ZoomChangeMessage,
} from "./types";
import { isContentMessage } from "./utils";

let { width: prevWidth, height: prevHeight } = window.screen;
let { devicePixelRatio: prevDevicePixelRatio } = window;

function onResizeListener() {
  const { width, height } = window.screen;
  if (prevWidth === width && prevHeight === height) {
    const { devicePixelRatio } = window;
    if (prevDevicePixelRatio === devicePixelRatio) {
      return;
    }
    prevDevicePixelRatio = devicePixelRatio;
    const message: ZoomChangeMessage = {
      type: "zoom-change",
      width,
      height,
    };
    browser.runtime.sendMessage(message);
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

const onMessageListener: browser.Runtime.OnMessageListenerCallback = (
  msg,
  _,
  sendResponse,
) => {
  if (!isContentMessage(msg)) {
    return true;
  }

  switch (msg.type) {
    case "get-monitor-key":
      const { width, height } = window.screen;
      const response: MonitorKeyMessage = {
        type: "monitor-key",
        width,
        height,
      };
      sendResponse(response);
      break;
  }

  return true;
};

window.addEventListener("resize", onResizeListener);
browser.runtime.onMessage.addListener(onMessageListener);
sendPageLoadMessage();

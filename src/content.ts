import browser from "webextension-polyfill";
import type {
  MonitorChangeMessage,
  MonitorKey,
  MonitorKeyMessage,
  PageLoadMessage,
  ZoomChangeMessage,
} from "./types";
import { isContentMessage } from "./utils";

let { width: prevWidth, height: prevHeight } = window.screen;
let { devicePixelRatio: prevDevicePixelRatio } = window;

let isZooming = false;
let isZoomingTimeout: number | undefined = undefined;

function startZoom(): void {
  window.clearTimeout(isZoomingTimeout);
  isZooming = true;
  isZoomingTimeout = window.setTimeout(() => {
    isZooming = false;
  }, 1000);
}

let sendZoomChangeMessageTimeout: number | undefined = undefined;

function sendZoomChangeMessage({ width, height }: MonitorKey): void {
  window.clearTimeout(sendZoomChangeMessageTimeout);
  const message: ZoomChangeMessage = {
    type: "zoom-change",
    width,
    height,
  };
  sendZoomChangeMessageTimeout = window.setTimeout(() => {
    browser.runtime.sendMessage(message);
  }, 1000);
}

function onResizeListener(): void {
  const { width, height } = window.screen;
  if (prevWidth === width && prevHeight === height) {
    const { devicePixelRatio } = window;
    if (prevDevicePixelRatio === devicePixelRatio || isZooming) {
      return;
    }
    prevDevicePixelRatio = devicePixelRatio;
    sendZoomChangeMessage({ width, height });
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

function sendPageLoadMessage(): void {
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
    case "start-zoom":
      startZoom();
      sendResponse(true);
      break;
  }

  return true;
};

window.addEventListener("resize", onResizeListener);
browser.runtime.onMessage.addListener(onMessageListener);
sendPageLoadMessage();

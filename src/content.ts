import browser from "webextension-polyfill";
import type {
  MonitorChangeMessage,
  MonitorKey,
  MonitorKeyMessage,
  PageLoadMessage,
  ZoomChangeMessage,
  ZoomResetMessage,
} from "./types";
import { isContentMessage } from "./utils";

function getKey(): MonitorKey {
  const { width, height } = window.screen;

  return { width, height };
}

let { width: prevWidth, height: prevHeight } = getKey();
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

let zoomChangeTimeout: number | undefined = undefined;

function sendZoomChangeMessage(): void {
  window.clearTimeout(zoomChangeTimeout);
  const {width, height} = getKey();
  const message: ZoomChangeMessage = {
    type: "zoom-change",
    width,
    height,
  };
  zoomChangeTimeout = window.setTimeout(() => {
    browser.runtime.sendMessage(message);
  }, 1000);
}

function onResizeListener(): void {
  const { width, height } = getKey();
  if (prevWidth === width && prevHeight === height) {
    const { devicePixelRatio } = window;
    if (prevDevicePixelRatio === devicePixelRatio || isZooming) {
      return;
    }
    prevDevicePixelRatio = devicePixelRatio;
    sendZoomChangeMessage();
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

function sendZoomResetMessage(): void {
  const { width, height } = getKey();
  const message: ZoomResetMessage = { type: "zoom-reset", width, height };
  browser.runtime.sendMessage(message);
}

function onKeyDownListener(e: KeyboardEvent): void {
  if ((e.ctrlKey || e.metaKey) && e.key === "0") {
    e.preventDefault();
    sendZoomResetMessage();
  }
}

window.addEventListener("resize", onResizeListener);
window.addEventListener("keydown", onKeyDownListener);
browser.runtime.onMessage.addListener(onMessageListener);
sendPageLoadMessage();

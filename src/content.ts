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

function sendZoomChangeMessage(): void {
  const { width, height } = getKey();
  const message: ZoomChangeMessage = {
    type: "zoom-change",
    width,
    height,
  };
  browser.runtime.sendMessage(message);
}

function getOnResizeListener(): () => void {
  let { width: prevWidth, height: prevHeight } = getKey();

  return (): void => {
    const { width, height } = getKey();
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
  };
}

function sendPageLoadMessage(): void {
  const { width, height } = getKey();

  const message: PageLoadMessage = {
    type: "page-load",
    width: width,
    height: height,
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
      const { width, height } = getKey();
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

function sendZoomResetMessage(): void {
  const { width, height } = getKey();
  const message: ZoomResetMessage = { type: "zoom-reset", width, height };
  browser.runtime.sendMessage(message);
}

function onKeyDownListener(e: KeyboardEvent): void {
  if (!e.ctrlKey && !e.metaKey) {
    return;
  }

  if (e.key === "0") {
    e.preventDefault();
    sendZoomResetMessage();
  } else if (e.key === "-") {
    sendZoomChangeMessage();
  } else if (e.key === "=") {
    sendZoomChangeMessage();
  }
}

function onWheelListener(e: WheelEvent): void {
  if (e.ctrlKey || e.metaKey) {
    sendZoomChangeMessage();
  }
}

function onPageShowListener(e: PageTransitionEvent) {
  if (e.persisted) {
    sendPageLoadMessage();
  }
}

sendPageLoadMessage();
window.addEventListener("pageshow", onPageShowListener);

const onResizeListener = getOnResizeListener();
window.addEventListener("resize", onResizeListener);
window.addEventListener("keydown", onKeyDownListener);
window.addEventListener("wheel", onWheelListener);

browser.runtime.onMessage.addListener(onMessageListener);

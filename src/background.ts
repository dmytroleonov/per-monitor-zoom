import browser from "webextension-polyfill";
import { getZoomFactor, isMessage } from "./utils";
import type { MonitorChangeMessage } from "./types";

async function setZoom(
  tabId: number | undefined,
  zoomFactor: number,
): Promise<void> {
  const currentZoomFactor = await browser.tabs.getZoom(tabId);
  if (currentZoomFactor === zoomFactor) {
    return;
  }
  await browser.tabs.setZoom(tabId, zoomFactor);
  await browser.tabs.setZoomSettings(tabId, {
    scope: "per-tab",
  });
}

async function setZoomForAllWindowTabs(
  windowId: number,
  zoomFactor: number,
): Promise<void> {
  const tabs = await browser.tabs.query({
    windowId,
  });

  await Promise.all(tabs.map((tab) => setZoom(tab.id, zoomFactor)));
}

async function onMonitorChange(
  msg: MonitorChangeMessage,
  sender: browser.Runtime.MessageSender,
): Promise<void> {
  if (!sender.tab || !sender.tab.windowId) return;

  const { width, height } = msg;
  const { windowId } = sender.tab;
  const zoomFactor = await getZoomFactor({ width, height });
  await setZoomForAllWindowTabs(windowId, zoomFactor);
}

const onMessageListener: browser.Runtime.OnMessageListenerAsync = async (
  msg,
  sender,
) => {
  if (!isMessage(msg)) {
    return;
  }

  switch (msg.type) {
    case "monitor-change":
      await onMonitorChange(msg, sender);
      break;
  }
};

browser.runtime.onMessage.addListener(onMessageListener);

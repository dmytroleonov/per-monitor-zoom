import browser from "webextension-polyfill";
import { getZoomFactor, isMessage } from "./utils";
import type { MonitorChangeMessage } from "./types";

async function onMonitorChange(
  msg: MonitorChangeMessage,
  sender: browser.Runtime.MessageSender,
): Promise<void> {
  if (!sender.tab) return;

  const { width, height } = msg;
  const zoomFactor = await getZoomFactor({ width, height });

  const tabId = sender.tab.id;
  await browser.tabs.setZoom(tabId, zoomFactor);
  await browser.tabs.setZoomSettings(tabId, {
    scope: "per-tab",
  });
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

import browser from "webextension-polyfill";
import { isMessage } from "./utils";
import type { MonitorChangeMessage } from "./types";

const monitorZoom: Record<number, number> = {
  1920: 1,
  2560: 1.5,
};

async function onMonitorChange(
  msg: MonitorChangeMessage,
  sender: browser.Runtime.MessageSender,
): Promise<void> {
  if (!sender.tab) return;

  const zoomFactor = monitorZoom[msg.width as number] ?? 1;

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

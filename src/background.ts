import browser from "webextension-polyfill";
import { getPatternFromUrl, getZoomFactor, isMessage } from "./utils";
import type { MonitorChangeMessage, PageLoadMessage } from "./types";

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

  tabs.forEach((tab) => setZoom(tab.id, zoomFactor));
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

async function onPageLoad(
  msg: PageLoadMessage,
  sender: browser.Runtime.MessageSender,
): Promise<void> {
  if (!sender.tab || !sender.tab.windowId) return;

  const { width, height } = msg;
  const { id } = sender.tab;
  const zoomFactor = await getZoomFactor({ width, height });
  await setZoom(id, zoomFactor);
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
    case "page-load":
      await onPageLoad(msg, sender);
      break;
  }
};

function onZoomChangeListener(
  zoomChangeInfo: browser.Tabs.OnZoomChangeZoomChangeInfoType,
): void {
  const { tabId, newZoomFactor, oldZoomFactor } = zoomChangeInfo;
  if (oldZoomFactor === newZoomFactor) {
    return;
  }
  (async () => {
    await browser.tabs.setZoomSettings(tabId, {
      scope: "per-tab",
    });

    const tab = await browser.tabs.get(tabId);
    if (!tab.windowId || !tab.url || !tab.active) {
      return;
    }
    const tabWindow = await browser.windows.get(tab.windowId);
    if (!tabWindow.focused) {
      return;
    }

    const urlPattern = getPatternFromUrl(tab.url);
    const tabs = await browser.tabs.query({
      url: urlPattern,
      // TODO: query each tab for it's width/height do determin wheather to
      // zoom it or not
      windowId: tab.windowId,
    });

    tabs.forEach((tab) => {
      if (tab.id !== tabId) {
        setZoom(tab.id, newZoomFactor);
      }
    });
  })();
}

browser.runtime.onMessage.addListener(onMessageListener);
browser.tabs.onZoomChange.addListener(onZoomChangeListener);

import browser from "webextension-polyfill";
import {
  getPatternFromUrl,
  getZoomFactor,
  isBackgroundMessage,
  isContentResponseMessage,
  isSameMonitorKey,
  tabHasId,
} from "./utils";
import type {
  GetMonitorKeyMessage,
  MonitorChangeMessage,
  MonitorKey,
  MonitorKeyMessage,
  PageLoadMessage,
  StartZoomMessage,
  ZoomChangeMessage,
} from "./types";

async function setZoom(tabId: number, zoomFactor: number): Promise<void> {
  const message: StartZoomMessage = { type: "start-zoom" };
  try {
    await browser.tabs.sendMessage(tabId, message);
    await browser.tabs.setZoom(tabId, zoomFactor);
  } catch {
    console.error(`Unable to set zoom on tab with id=${tabId}`);
  }
}

async function zoomTabs(tabIds: number[], zoomFactor: number): Promise<void> {
  await Promise.allSettled(
    tabIds.map(async (tabId) => await setZoom(tabId, zoomFactor)),
  );
}

async function setZoomForAllWindowTabs(
  windowId: number,
  zoomFactor: number,
): Promise<void> {
  const tabs = await browser.tabs.query({
    windowId,
  });

  const tabIdsToZoom = tabs.filter(tabHasId).map((tab) => tab.id);
  await zoomTabs(tabIdsToZoom, zoomFactor);
}

async function onMonitorChange(
  msg: MonitorChangeMessage,
  sender: browser.Runtime.MessageSender,
): Promise<void> {
  if (!sender.tab || !sender.tab.windowId) {
    return;
  }

  const { width, height } = msg;
  const { windowId } = sender.tab;
  const zoomFactor = await getZoomFactor({ width, height });
  await setZoomForAllWindowTabs(windowId, zoomFactor);
}

async function onPageLoad(
  msg: PageLoadMessage,
  sender: browser.Runtime.MessageSender,
): Promise<void> {
  if (!sender.tab?.id) {
    return;
  }

  const { width, height } = msg;
  const { id: tabId } = sender.tab;
  const zoomFactor = await getZoomFactor({ width, height });
  await browser.tabs.setZoomSettings(tabId, {
    scope: "per-tab",
  });
  await zoomTabs([tabId], zoomFactor);
}

async function sendGetMonitorKeyMessage(tabId: number): Promise<MonitorKey> {
  const message: GetMonitorKeyMessage = { type: "get-monitor-key" };
  const response = await browser.tabs.sendMessage(tabId, message);
  if (
    !isContentResponseMessage(response) ||
    !(response.type === "monitor-key")
  ) {
    throw new Error(
      `Unexpected resonse type. Expected "monitor-key", got ${response}`,
    );
  }
  const { width, height }: MonitorKeyMessage = response;

  return {
    width,
    height,
  };
}

async function onZoomChange(
  msg: ZoomChangeMessage,
  sender: browser.Runtime.MessageSender,
): Promise<void> {
  if (!sender.tab?.id || !sender.tab.url) {
    return;
  }

  const {
    tab: { id: tabId, url },
  } = sender;
  const { width, height } = msg;
  const zoomTabMonitorKey = { width, height };

  const zoomFactor = await browser.tabs.getZoom(tabId);

  const urlPattern = getPatternFromUrl(url);
  const tabs = await browser.tabs.query({
    url: urlPattern,
  });
  const tabIdsToZoom = tabs
    .filter(
      (tab): tab is browser.Tabs.Tab & { id: number } =>
        tabHasId(tab) && tab.id !== tabId,
    )
    .map((tab) => tab.id);

  await Promise.allSettled(
    tabIdsToZoom.map(async (tabId) => {
      const monitorKey = await sendGetMonitorKeyMessage(tabId);
      if (isSameMonitorKey(zoomTabMonitorKey, monitorKey)) {
        await setZoom(tabId, zoomFactor);
      }
    }),
  );
}

const onMessageListener: browser.Runtime.OnMessageListenerAsync = async (
  msg,
  sender,
): Promise<void> => {
  if (!isBackgroundMessage(msg)) {
    return;
  }

  switch (msg.type) {
    case "monitor-change":
      await onMonitorChange(msg, sender);
      break;
    case "page-load":
      await onPageLoad(msg, sender);
      break;
    case "zoom-change":
      await onZoomChange(msg, sender);
      break;
  }
};

browser.runtime.onMessage.addListener(onMessageListener);

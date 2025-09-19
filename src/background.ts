import browser from "webextension-polyfill";
import {
  getPatternFromUrl,
  getZoomFactor,
  isBackgroundMessage,
  isSameMonitorKey,
} from "./utils";
import type {
  GetMonitorKeyMessage,
  MonitorChangeMessage,
  MonitorKey,
  MonitorKeyMessage,
  PageLoadMessage,
  ZoomChangeMessage,
} from "./types";

const tabsBeingZoomed = new Set<number>();

async function setZoom(tabId: number, zoomFactor: number): Promise<void> {
  await browser.tabs.setZoom(tabId, zoomFactor);
}

function lockTabs(tabIds: number[]): void {
  for (const tab of tabIds) {
    tabsBeingZoomed.add(tab);
  }
}

function unLockTabs(tabIds: number[]): void {
  for (const tab of tabIds) {
    tabsBeingZoomed.delete(tab);
  }
}

async function zoomTabs(tabIds: number[], zoomFactor: number): Promise<void> {
  lockTabs(tabIds);
  try {
    await Promise.allSettled(
      tabIds.map(async (tabId) => setZoom(tabId, zoomFactor)),
    );
  } finally {
    unLockTabs(tabIds);
  }
}

async function setZoomForAllWindowTabs(
  windowId: number,
  zoomFactor: number,
): Promise<void> {
  const tabs = await browser.tabs.query({
    windowId,
  });

  const tabIdsToZoom = tabs.filter((tab) => tab.id).map((tab) => tab.id!);
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
  const { width, height }: MonitorKeyMessage = await browser.tabs.sendMessage(
    tabId,
    message,
  );

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
  if (!url || tabsBeingZoomed.has(tabId)) {
    return;
  }

  const { width, height } = msg;
  const zoomTabMonitorKey = { width, height };

  const zoomFactor = await browser.tabs.getZoom(tabId);

  const urlPattern = getPatternFromUrl(url);
  const tabs = await browser.tabs.query({
    url: urlPattern,
  });
  const tabIdsToZoom = tabs
    .filter((tab) => tab.id && tab.id !== tabId)
    .map((tab) => tab.id!);
  lockTabs(tabIdsToZoom);

  await Promise.allSettled(
    tabIdsToZoom.map(async (tabId) => {
      const monitorKey = await sendGetMonitorKeyMessage(tabId);
      if (isSameMonitorKey(zoomTabMonitorKey, monitorKey)) {
        await setZoom(tabId, zoomFactor);
      }
    }),
  );

  unLockTabs(tabIdsToZoom);
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

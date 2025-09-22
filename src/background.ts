import browser from "webextension-polyfill";
import {
  findMonitor,
  getPatternFromUrl,
  getZoomFactorByUrl,
  isBackgroundMessage,
  isContentResponseMessage,
  isSameMonitorKey,
  setZoomFactorByUrl,
} from "./utils";
import type {
  GetMonitorKeyMessage,
  MonitorChangeMessage,
  MonitorKey,
  MonitorKeyMessage,
  PageLoadMessage,
  StartZoomMessage,
  TabWithId,
  ZoomChangeMessage,
  ZoomResetMessage,
} from "./types";

type SetZoomOptions = {
  suppressZoomEvents?: boolean;
};

async function setZoom(
  tabId: number,
  zoomFactor: number,
  { suppressZoomEvents = true }: SetZoomOptions = {},
): Promise<void> {
  const message: StartZoomMessage = { type: "start-zoom" };
  try {
    if (suppressZoomEvents) {
      await browser.tabs.sendMessage(tabId, message);
    }
    await browser.tabs.setZoom(tabId, zoomFactor);
  } catch {
    console.error(`Unable to set zoom on tab with id=${tabId}`);
  }
}

async function zoomTabs(
  tabs: { id: number; zoomFactor: number }[],
): Promise<void> {
  await Promise.allSettled(
    tabs.map(async (tab) => await setZoom(tab.id, tab.zoomFactor)),
  );
}

async function setZoomForAllWindowTabs(
  key: MonitorKey,
  windowId: number,
): Promise<void> {
  const tabs = await browser.tabs.query({
    windowId,
  });
  const tabsToZoomPromise = tabs
    .filter((tab): tab is TabWithId & { url: string } => !!tab.id && !!tab.url)
    .map(async (tab) => {
      const zoomFactor = await getZoomFactorByUrl(key, tab.url);
      return { id: tab.id, zoomFactor };
    });

  const tabsToZoom = (await Promise.allSettled(tabsToZoomPromise))
    .filter((res) => res.status === "fulfilled")
    .map((res) => res.value);

  await zoomTabs(tabsToZoom);
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
  await setZoomForAllWindowTabs({ width, height }, windowId);
}

async function onPageLoad(
  msg: PageLoadMessage,
  sender: browser.Runtime.MessageSender,
): Promise<void> {
  if (!sender.tab?.id || !sender.tab.url) {
    return;
  }

  const { width, height } = msg;
  const { id: tabId, url } = sender.tab;
  const zoomFactor = await getZoomFactorByUrl({ width, height }, url);
  await browser.tabs.setZoomSettings(tabId, {
    scope: "per-tab",
  });
  await setZoom(tabId, zoomFactor);
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
    .filter((tab): tab is TabWithId => !!tab.id && tab.id !== tabId)
    .map((tab) => tab.id);

  await setZoomFactorByUrl(zoomTabMonitorKey, url, zoomFactor);
  await Promise.allSettled(
    tabIdsToZoom.map(async (tabId) => {
      const monitorKey = await sendGetMonitorKeyMessage(tabId);
      if (isSameMonitorKey(zoomTabMonitorKey, monitorKey)) {
        await setZoom(tabId, zoomFactor);
      }
    }),
  );
}

async function onZoomReset(
  msg: ZoomResetMessage,
  sender: browser.Runtime.MessageSender,
): Promise<void> {
  if (!sender?.tab?.url || !sender.tab.id) {
    return;
  }

  const {
    tab: { url, id: tabId },
  } = sender;
  const { width, height } = msg;
  const zoomTabMonitorKey = { width, height };

  const monitor = await findMonitor(zoomTabMonitorKey);
  if (!monitor) {
    return;
  }

  const zoomFactor = monitor.defaultZoomFactor;
  const urlPattern = getPatternFromUrl(url);
  const tabs = await browser.tabs.query({
    url: urlPattern,
  });
  const tabIdsToZoom = tabs
    .filter((tab): tab is TabWithId => !!tab.id && tab.id !== tabId)
    .map((tab) => tab.id);

  await setZoomFactorByUrl({ width, height }, url, zoomFactor);
  await setZoom(tabId, zoomFactor, { suppressZoomEvents: false });
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
    case "zoom-reset":
      await onZoomReset(msg, sender);
      break;
  }
};

browser.runtime.onMessage.addListener(onMessageListener);

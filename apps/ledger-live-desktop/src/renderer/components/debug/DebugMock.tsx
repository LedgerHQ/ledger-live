/* eslint-disable @typescript-eslint/ban-ts-comment */

import React, { useCallback, useState } from "react";
import { getEnv } from "@ledgerhq/live-env";
import Text from "~/renderer/components/Text";
import { ReplaySubject } from "rxjs";
import { deserializeError } from "@ledgerhq/errors";
import { fromTransactionRaw } from "@ledgerhq/live-common/transaction/index";
import {
  deviceInfo155,
  deviceInfo210lo5,
  mockListAppsResult as innerMockListAppResult,
} from "@ledgerhq/live-common/apps/mock";
import { AppType, DeviceInfo } from "@ledgerhq/types-live";
import { useAnnouncements } from "@ledgerhq/live-common/notifications/AnnouncementProvider/index";
import { useFilteredServiceStatus } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/index";
// @ts-ignore should move mocks inside project and import in tests
import { addMockAnnouncement } from "../../../../tests/mocks/notificationsHelpers";
// @ts-ignore should move mocks inside project and import in tests
import { toggleMockIncident } from "../../../../tests/mocks/serviceStatusHelpers";
import useInterval from "~/renderer/hooks/useInterval";
import Box from "~/renderer/components/Box";
import { Item, MockContainer, EllipsesText, MockedGlobalStyle } from "./shared";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { ListAppsResult } from "@ledgerhq/live-common/apps/types";
import { AnnouncementDeviceModelId } from "@ledgerhq/live-common/notifications/AnnouncementProvider/types";
import { getAllFeatureFlags } from "@ledgerhq/live-common/e2e/index";
import { getAllEnvs } from "@ledgerhq/live-env";
import { ipcRenderer } from "electron";
import { memoryLogger } from "~/renderer/logger";

const mockListAppsResult = (
  appDesc: string,
  installedDesc: string,
  deviceInfo: DeviceInfo,
  deviceModelId?: DeviceModelId,
): ListAppsResult => {
  // Nb Should move this polyfill to live-common eventually.
  const result = innerMockListAppResult(appDesc, installedDesc, deviceInfo, deviceModelId);
  Object.keys(result?.appByName).forEach(key => {
    result.appByName[key] = {
      ...result.appByName[key],
      type: AppType.currency,
    };
  });
  return result;
};
/**
 * List of events that will be displayed in the quick-link section of the mock menu
 * to ease the usability when mock is done manually instead of through playwright.
 */
const helpfulEvents = [
  {
    name: "opened",
    event: {
      type: "opened",
    },
  },
  {
    name: "deviceChange",
    event: {
      type: "deviceChange",
      device: null,
    },
  },
  {
    name: "listApps",
    event: {
      type: "listingApps",
      deviceInfo: deviceInfo155,
    },
  },
  {
    name: "result",
    event: {
      type: "result",
      result: mockListAppsResult(
        "Bitcoin,Tron,Litecoin,Ethereum,Ripple,Stellar",
        "Bitcoin,Tron,Litecoin,Ethereum",
        deviceInfo155,
      ),
    },
  },
  {
    name: "resultOutdated",
    event: {
      type: "result",
      result: mockListAppsResult(
        "Bitcoin,Tron,Litecoin,Ethereum,Ripple,Stellar",
        "Bitcoin,Tron,Litecoin,Ethereum (outdated)",
        deviceInfo155,
      ),
    },
  },
  {
    name: "permission requested",
    event: {
      type: "device-permission-requested",
    },
  },
  {
    name: "permission granted",
    event: {
      type: "device-permission-granted",
    },
  },
  {
    name: "quitApp",
    event: {
      type: "appDetected",
    },
  },
  {
    name: "unresponsiveDevice",
    event: {
      type: "unresponsiveDevice",
    },
  },
  {
    name: "complete",
    event: {
      type: "complete",
    },
  },
];
const swapEvents = [
  {
    name: "result without Exchange",
    event: {
      type: "result",
      result: mockListAppsResult(
        "Bitcoin,Tron,Litecoin,Ethereum,Ripple,Stellar",
        "Bitcoin,Tron,Litecoin,Ethereum",
        deviceInfo155,
      ),
    },
  },
  {
    name: "result with outdated Exchange",
    event: {
      type: "result",
      result: mockListAppsResult(
        "Bitcoin,Tron,Litecoin,Ethereum,Ripple,Stellar,Exchange",
        "Exchange(outdated),Tron,Bitcoin,Ethereum",
        deviceInfo155,
      ),
    },
  },
  {
    name: "result with Exchange",
    event: {
      type: "result",
      result: mockListAppsResult(
        "Bitcoin,Tron,Litecoin,Ethereum,Ripple,Stellar,Exchange",
        "Exchange,Tron,Bitcoin,Ethereum",
        deviceInfo155,
      ),
    },
  },
  {
    name: "result with only Exchange",
    event: {
      type: "result",
      result: mockListAppsResult(
        "Bitcoin,Tron,Litecoin,Ethereum,Ripple,Stellar,Exchange",
        "Exchange",
        deviceInfo155,
      ),
    },
  },
  {
    name: "result with only Exchange+BTC",
    event: {
      type: "result",
      result: mockListAppsResult(
        "Bitcoin,Tron,Litecoin,Ethereum,Ripple,Stellar,Exchange",
        "Exchange,Bitcoin",
        deviceInfo155,
      ),
    },
  },
  {
    name: "init-swap-requested",
    event: {
      type: "init-swap-requested",
    },
  },
  {
    name: "init-swap-error",
    event: {
      type: "init-swap-error",
      error: {
        name: "SwapGenericAPIError",
      },
    },
  },
  {
    name: "init-swap-result",
    event: {
      type: "init-swap-result",
      initSwapResult: {
        transaction: fromTransactionRaw({
          family: "bitcoin",
          recipient: "1Cz2ZXb6Y6AacXJTpo4RBjQMLEmscuxD8e",
          amount: "1",
          feePerByte: "1",
          networkInfo: {
            family: "bitcoin",
            feeItems: {
              items: [
                {
                  key: "0",
                  speed: "high",
                  feePerByte: "3",
                },
                {
                  key: "1",
                  speed: "standard",
                  feePerByte: "2",
                },
                {
                  key: "2",
                  speed: "low",
                  feePerByte: "1",
                },
              ],
              defaultFeePerByte: "1",
            },
          },
          rbf: false,
          utxoStrategy: {
            strategy: 0,
            excludeUTXOs: [],
          },
        }),
        swapId: "12345",
      },
    },
  },
];
const localizationEvents = [
  {
    name: "listAppsWithLocalization",
    event: {
      type: "listingApps",
      deviceInfo: deviceInfo210lo5,
    },
  },
  {
    name: "resultWithLocalization",
    event: {
      type: "result",
      result: mockListAppsResult(
        "Bitcoin,Tron,Litecoin,Ethereum,Ripple,Stellar",
        "Bitcoin,Tron,Litecoin,Ethereum (outdated)",
        deviceInfo210lo5,
      ),
    },
  },
  {
    name: "requestLanguageInstallation",
    event: {
      type: "devicePermissionRequested",
    },
  },
  {
    name: "languageInstallationProgress50",
    event: {
      type: "progress",
      progress: 0.5,
    },
  },
  {
    name: "languageInstallationComplete",
    event: {
      type: "languageInstalled",
    },
  },
];

interface RawEvents {
  [key: string]: unknown;
}
window.getAllFeatureFlags = getAllFeatureFlags;
window.getAllEnvs = getAllEnvs;
window.saveLogs = async (path: string): Promise<void> => {
  const memoryLogs = memoryLogger.getMemoryLogs();

  try {
    // Serializes ourself with `stringify` to avoid "object could not be cloned" errors from the electron IPC serializer.
    const memoryLogsStr = JSON.stringify(memoryLogs, null, 2);
    // Requests the main process to save logs in a file
    await ipcRenderer.invoke(
      "save-logs",
      {
        canceled: false,
        filePath: path,
      },
      memoryLogsStr,
    );
  } catch (error) {
    console.error("Error while requesting to save logs from the renderer process", error);
  }
};

if (getEnv("MOCK")) {
  window.mock = {
    fromTransactionRaw,
    events: {
      test: 0,
      queue: [] as Record<string, unknown>[],
      history: [],
      subject: new ReplaySubject<unknown>(),
      get parseRawEvents() {
        return (rawEvents: RawEvents | RawEvents[], maybeKey?: string): unknown => {
          if (rawEvents && typeof rawEvents === "object") {
            if (maybeKey === "error") {
              return deserializeError(rawEvents) as Error;
            }
            if (Array.isArray(rawEvents)) return rawEvents.map(rE => this.parseRawEvents(rE));
            const event: Record<string, unknown> = {};
            // clone the object if and only if it is a basic object. to not convert BigNumber
            if (Object.getPrototypeOf(rawEvents) === Object.prototype) {
              for (const k in rawEvents) {
                if (rawEvents.hasOwnProperty(k)) {
                  event[k] = this.parseRawEvents(rawEvents[k] as RawEvents, k);
                }
              }
              return event;
            }
          }
          return rawEvents;
        };
      },
      get emitter() {
        return () => {
          // Cleanup the queue of complete events
          while (this.queue.length && this.queue[0].type === "complete") {
            this.queue.shift();
          }
          if (this.subject.isStopped) {
            this.subject = new ReplaySubject<unknown>();
          }
          return this.subject;
        };
      },
      get mockDeviceEvent() {
        return (...o: RawEvents[]) => {
          const rE = this.parseRawEvents(o);
          if (Array.isArray(rE)) {
            for (const e of rE) this.queue.push(e);
          }
        };
      },
      exposed: {
        mockListAppsResult,
        deviceInfo155,
      },
    },
  };
  const observerAwareEventLoop = () => {
    const { subject, queue, history } = window.mock.events;
    while (subject.observers.length && !subject.isStopped && queue.length) {
      const event = queue.shift();
      if (!event) return;
      if (event.type === "complete") {
        subject.complete();
        window.mock.events.subject = new ReplaySubject<unknown>();
      } else {
        subject.next(event);
      }
      history.push(event);
    }

    // If no observers consume "complete" events that are on top of the list
    while (!subject.observers.length && queue.length && queue[0].type === "complete") {
      const event = queue.shift();
      subject.complete();
      history.push(event as Record<string, unknown>);
      window.mock.events.subject = new ReplaySubject<unknown>();
    }
    setTimeout(observerAwareEventLoop, 400);
  };
  observerAwareEventLoop();
}

export const mockedEventEmitter = getEnv("MOCK") ? window.mock.events.emitter : null;
const DebugMock = () => {
  const [queue, setQueue] = useState(window.mock.events.queue);
  const [history, setHistory] = useState(window.mock.events.history);
  const [nonce, setNonce] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const [expandedQueue, setExpandedQueue] = useState(true);
  const [expandedSwap, setExpandedSwap] = useState(false);
  const [expandedLocalization, setExpandedLocalization] = useState(false);
  const [expandedQuick, setExpandedQuick] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState(true);
  const [expandedNotif, setExpandedNotif] = useState(false);
  const [notifPlatform, setNotifPlatform] = useState("");
  const [notifAppVersions, setNotifAppVersions] = useState("");
  const [notifLiveCommonVersions, setNotifLiveCommonVersions] = useState("");
  const [notifCurrencies, setNotifCurrencies] = useState("");
  const [notifDeviceVersion, setNotifDeviceVersion] = useState("");
  const [notifDeviceModelId, setNotifDeviceModelId] = useState("");
  const [notifDeviceApps, setNotifDeviceApps] = useState("");
  const [notifLanguages, setNotifLanguages] = useState("");
  const [notifExtra, setNotifExtra] = useState("");
  const { updateCache } = useAnnouncements();
  const { updateData } = useFilteredServiceStatus();
  useInterval(() => {
    setQueue(window.mock.events.queue);
    setHistory(window.mock.events.history);
    setNonce(nonce + 1);
  }, 2000);
  const toggleExpanded = useCallback(() => setExpanded(!expanded), [expanded, setExpanded]);
  const toggleExpandedQueue = useCallback(() => setExpandedQueue(!expandedQueue), [expandedQueue]);
  const toggleExpandedQuick = useCallback(() => setExpandedQuick(!expandedQuick), [expandedQuick]);
  const toggleExpandedHistory = useCallback(
    () => setExpandedHistory(!expandedHistory),
    [expandedHistory],
  );
  const toggleExpandedSwap = useCallback(() => setExpandedSwap(!expandedSwap), [expandedSwap]);
  const toggleExpandedLocalization = useCallback(
    () => setExpandedLocalization(!expandedLocalization),
    [expandedLocalization],
  );
  const toggleExpandedNotif = useCallback(() => setExpandedNotif(!expandedNotif), [expandedNotif]);
  const queueEvent = useCallback(
    (event: RawEvents) => {
      setQueue([...queue, event]);
      window.mock.events.mockDeviceEvent(event);
    },
    [queue, setQueue],
  );
  const unQueueEventByIndex = useCallback(
    (i: number) => {
      window.mock.events.queue.splice(i, 1);
      setQueue(window.mock.events.queue);
    },
    [setQueue],
  );
  const formatInputValue = useCallback((inputValue: string): string[] | undefined | null => {
    const val: string[] = inputValue.replace(/\s/g, "").split(",").filter(Boolean);
    return val.length > 0 ? val : undefined;
  }, []);
  const onNotifClick = useCallback(() => {
    const params = {
      currencies: formatInputValue(notifCurrencies),
      platforms: formatInputValue(notifPlatform),
      appVersions: formatInputValue(notifAppVersions),
      liveCommonVersions: formatInputValue(notifLiveCommonVersions),
      languages: formatInputValue(notifLanguages),
    };
    const keys = Object.keys(params) as (keyof typeof params)[];
    const formattedParams = keys
      .filter(k => !!params[k] && params[k]!.length > 0)
      .reduce(
        (sum, k) => ({
          ...sum,
          [k]: params[k],
        }),
        {},
      );
    let extra = {};
    try {
      extra = JSON.parse(notifExtra) || {};
    } catch (e) {
      console.error(e);
    }
    addMockAnnouncement({
      ...formattedParams,
      device: {
        modelIds: formatInputValue(notifDeviceModelId) as AnnouncementDeviceModelId,
        versions: formatInputValue(notifDeviceVersion) as string[],
        apps: formatInputValue(notifDeviceApps) as string[],
      },
      ...extra,
    });
    updateCache();
  }, [
    formatInputValue,
    notifCurrencies,
    notifDeviceApps,
    notifDeviceModelId,
    notifDeviceVersion,
    notifExtra,
    notifLanguages,
    notifPlatform,
    notifAppVersions,
    notifLiveCommonVersions,
    updateCache,
  ]);

  const setValue = useCallback(
    (setter: (value: string) => void) =>
      (evt: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setter(evt.target.value),
    [],
  );
  return (
    <MockContainer id={`${nonce}`}>
      <Box>
        <Item
          id={`${nonce}`}
          color="palette.text.shade100"
          ff="Inter|Medium"
          fontSize={3}
          onClick={toggleExpanded}
        >
          {expanded ? "mock [ - ]" : "m"}
        </Item>
      </Box>
      {expanded ? (
        <>
          {queue.length ? (
            <Box px={1}>
              <Text
                color="palette.text.shade100"
                ff="Inter|SemiBold"
                fontSize={3}
                onClick={toggleExpandedQueue}
              >
                {"queue "}
                {expandedQueue ? "[ - ]" : "[ + ]"}
              </Text>
              {expandedQueue
                ? queue.map((e, i) => (
                    <Box horizontal key={i}>
                      <Text
                        style={{
                          marginLeft: 10,
                        }}
                        ff="Inter|Medium"
                        color="palette.text.shade100"
                        fontSize={3}
                        onClick={() => unQueueEventByIndex(i)}
                      >
                        {"[ x ] "}
                      </Text>
                      <EllipsesText title={JSON.stringify(e)}>{JSON.stringify(e)}</EllipsesText>
                    </Box>
                  ))
                : null}
            </Box>
          ) : null}
          {history.length ? (
            <Box px={1}>
              <Text
                color="palette.text.shade100"
                ff="Inter|SemiBold"
                fontSize={3}
                onClick={toggleExpandedHistory}
              >
                {"history "}
                {expandedHistory ? "[ - ]" : "[ + ]"}
              </Text>
              {expandedHistory
                ? history.map((e, i) => (
                    <Box horizontal key={i} onClick={() => queueEvent(e)}>
                      <EllipsesText title={JSON.stringify(e)}>{JSON.stringify(e)}</EllipsesText>
                    </Box>
                  ))
                : null}
            </Box>
          ) : null}
          {/* Events here are supposed to be generic and not for a specific flow */}
          <Box px={1}>
            <Text
              color="palette.text.shade100"
              ff="Inter|SemiBold"
              fontSize={3}
              onClick={toggleExpandedQuick}
            >
              {"quick-list "}
              {expandedQuick ? "[ - ]" : "[ + ]"}
            </Text>
            {expandedQuick
              ? helpfulEvents.map(({ name, event }, i) => (
                  <Text
                    mx={1}
                    ff="Inter|Regular"
                    color="palette.text.shade100"
                    fontSize={3}
                    key={i}
                    onClick={() => queueEvent(event)}
                  >
                    {name}
                  </Text>
                ))
              : null}
          </Box>
          <Box px={1}>
            <Text
              color="palette.text.shade100"
              ff="Inter|SemiBold"
              fontSize={3}
              onClick={toggleExpandedSwap}
            >
              {"swap "}
              {expandedSwap ? "[ - ]" : "[ + ]"}
            </Text>
            {expandedSwap
              ? swapEvents.map(({ name, event }, i) => (
                  <Text
                    ff="Inter|Regular"
                    color="palette.text.shade100"
                    fontSize={3}
                    key={i}
                    onClick={() => queueEvent(event)}
                  >
                    {name}
                  </Text>
                ))
              : null}
          </Box>
          <Box px={1}>
            <Text
              color="palette.text.shade100"
              ff="Inter|SemiBold"
              fontSize={3}
              onClick={toggleExpandedLocalization}
            >
              {"localization "}
              {expandedLocalization ? "[ - ]" : "[ + ]"}
            </Text>
            {expandedLocalization
              ? localizationEvents.map(({ name, event }, i) => (
                  <Text
                    ff="Inter|Regular"
                    color="palette.text.shade100"
                    fontSize={3}
                    key={i}
                    onClick={() => queueEvent(event)}
                  >
                    {name}
                  </Text>
                ))
              : null}
          </Box>
          <Box px={1}>
            <Text
              color="palette.text.shade100"
              ff="Inter|SemiBold"
              fontSize={3}
              onClick={toggleExpandedNotif}
            >
              {"notif "}
              {expandedNotif ? "[ - ]" : "[ + ]"}
            </Text>
            {expandedNotif ? (
              <>
                <input
                  type="text"
                  placeholder="currencies separated by ','"
                  value={notifCurrencies}
                  onChange={setValue(setNotifCurrencies)}
                />
                <input
                  type="text"
                  placeholder="platforms separated by ','"
                  value={notifPlatform}
                  onChange={setValue(setNotifPlatform)}
                />
                <input
                  type="text"
                  placeholder="languages separated by ','"
                  value={notifLanguages}
                  onChange={setValue(setNotifLanguages)}
                />
                <input
                  type="text"
                  placeholder="device modelIds separated by ','"
                  value={notifDeviceModelId}
                  onChange={setValue(setNotifDeviceModelId)}
                />
                <input
                  type="text"
                  placeholder="device versions separated by ','"
                  value={notifDeviceVersion}
                  onChange={setValue(setNotifDeviceVersion)}
                />
                <input
                  type="text"
                  placeholder="device apps separated by ','"
                  value={notifDeviceApps}
                  onChange={setValue(setNotifDeviceApps)}
                />
                <input
                  type="text"
                  placeholder="app versions separated by ','"
                  value={notifAppVersions}
                  onChange={setValue(setNotifAppVersions)}
                />
                <input
                  type="text"
                  placeholder="live-common versions separated by ','"
                  value={notifLiveCommonVersions}
                  onChange={setValue(setNotifLiveCommonVersions)}
                />
                <textarea
                  placeholder="override notif data as JSON"
                  value={notifExtra}
                  onChange={setValue(setNotifExtra)}
                />
                <Text
                  ff="Inter|Regular"
                  color="palette.text.shade100"
                  fontSize={3}
                  mb={2}
                  onClick={onNotifClick}
                >
                  {"↳ Mock notif"}
                </Text>
                <Text
                  ff="Inter|Regular"
                  color="palette.text.shade100"
                  mb={2}
                  fontSize={3}
                  onClick={() => {
                    toggleMockIncident();
                    updateData();
                  }}
                >
                  {"Toggle service status"}
                </Text>
              </>
            ) : null}
          </Box>
        </>
      ) : null}
    </MockContainer>
  );
};
export default process.env.HIDE_DEBUG_MOCK ? MockedGlobalStyle : DebugMock;

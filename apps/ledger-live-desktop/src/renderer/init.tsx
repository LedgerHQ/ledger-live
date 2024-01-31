import React from "react";
import Transport from "@ledgerhq/hw-transport";
import { getEnv } from "@ledgerhq/live-env";
import { NotEnoughBalance } from "@ledgerhq/errors";
import { implicitMigration } from "@ledgerhq/live-common/migrations/accounts";
import { log } from "@ledgerhq/logs";
import { checkLibs } from "@ledgerhq/live-common/sanityChecks";
import { importPostOnboardingState } from "@ledgerhq/live-common/postOnboarding/actions";
import i18n from "i18next";
import { webFrame, ipcRenderer } from "electron";
// We can't use new createRoot for now. We have issues we react-redux 7.x and lazy load of components
// https://github.com/reduxjs/react-redux/issues/1977
// eslint-disable-next-line react/no-deprecated
import { render } from "react-dom";
import moment from "moment";
import each from "lodash/each";
import { reload, getKey, loadLSS } from "~/renderer/storage";
import { hardReset } from "~/renderer/reset";
import "~/renderer/styles/global";
import "~/renderer/live-common-setup";
import { getLocalStorageEnvs } from "~/renderer/experimental";
import "~/renderer/i18n/init";
import { hydrateCurrency, prepareCurrency } from "~/renderer/bridge/cache";
import {
  getCryptoCurrencyById,
  findCryptoCurrencyById,
} from "@ledgerhq/live-common/currencies/index";
import logger, { enableDebugLogger } from "./logger";
import { enableGlobalTab, disableGlobalTab, isGlobalTabEnabled } from "~/config/global-tab";
import sentry from "~/sentry/renderer";
import { setEnvOnAllThreads } from "~/helpers/env";
import dbMiddleware from "~/renderer/middlewares/db";
import createStore from "~/renderer/createStore";
import events from "~/renderer/events";
import { setAccounts } from "~/renderer/actions/accounts";
import { fetchSettings, setDeepLinkUrl } from "~/renderer/actions/settings";
import { lock, setOSDarkMode } from "~/renderer/actions/application";
import {
  languageSelector,
  sentryLogsSelector,
  hideEmptyTokenAccountsSelector,
  localeSelector,
  filterTokenOperationsZeroAmountSelector,
} from "~/renderer/reducers/settings";
import ReactRoot from "~/renderer/ReactRoot";
import AppError from "~/renderer/AppError";
import { expectOperatingSystemSupportStatus } from "~/support/os";
import { addDevice, removeDevice, resetDevices } from "~/renderer/actions/devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { listCachedCurrencyIds } from "./bridge/cache";
import { LogEntry } from "winston";
import { LiveConfig } from "@ledgerhq/live-config/featureFlags/index";

const rootNode = document.getElementById("react-root");
const TAB_KEY = 9;

async function init() {
  // at this step. we know the app error handling will happen here. so we can unset the global onerror
  window.onerror = null;

  const logVerbose = getEnv("VERBOSE");

  // Sets up a debug console printing of logs (from the renderer process)
  //
  // Usage: a filtering (only on console printing) on Ledger libs are possible:
  // - VERBOSE="apdu,hw,transport,hid-verbose" : filtering on a list of log `type` separated by a `,`
  // - VERBOSE=1 or VERBOSE=true : to print all logs
  if (logVerbose) {
    const everyLogs =
      logVerbose.length === 1 && (logVerbose[0] === "true" || logVerbose[0] === "1");

    const filters = everyLogs ? [] : logVerbose;

    // eslint-disable-next-line no-console
    console.log(
      `Logs console display setup (renderer process): ${JSON.stringify({
        everyLogs,
        filters,
      })}`,
    );
    enableDebugLogger((log: LogEntry) => everyLogs || (log?.type && filters.includes(log.type)));
  }

  checkLibs({
    NotEnoughBalance,
    React,
    log,
    Transport,
  });

  LiveConfig.init({
    appVersion: __APP_VERSION__,
    platform: "desktop",
    environment: process.env.NODE_ENV || "development",
  });

  expectOperatingSystemSupportStatus();
  if (getEnv("PLAYWRIGHT_RUN")) {
    const spectronData = await getKey("app", "PLAYWRIGHT_RUN", {});
    each(spectronData.localStorage, (value, key) => {
      global.localStorage.setItem(key, value);
    });
    const envs = getLocalStorageEnvs();
    for (const k in envs) setEnvOnAllThreads(k, envs[k]);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const timemachine = require("timemachine");
    timemachine.config({
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      dateString: require("../../tests/time").default,
    });
  }
  if (window.localStorage.getItem("hard-reset")) {
    await hardReset();
  }
  const store = createStore({
    dbMiddleware,
  });
  sentry(() => sentryLogsSelector(store.getState()));
  let notifiedSentryLogs = false;
  store.subscribe(() => {
    const next = sentryLogsSelector(store.getState());
    if (next !== notifiedSentryLogs) {
      notifiedSentryLogs = next;
      ipcRenderer.send("sentryLogsChanged", next);
    }
  });
  let deepLinkUrl; // Nb In some cases `fetchSettings` runs after this, voiding the deep link.
  if (process.env.LEDGER_LIVE_DEEPLINK) {
    deepLinkUrl = process.env.LEDGER_LIVE_DEEPLINK;
    store.dispatch(setDeepLinkUrl(deepLinkUrl));
  }
  ipcRenderer.once("deep-linking", (_, url: string) => {
    store.dispatch(setDeepLinkUrl(url));
    deepLinkUrl = url;
  });
  const initialSettings = (await getKey("app", "settings")) || {};

  fetchSettings(
    deepLinkUrl
      ? {
          ...initialSettings,
          deepLinkUrl,
        }
      : initialSettings,
  )(store.dispatch);
  const state = store.getState();
  const language = languageSelector(state);
  const locale = localeSelector(state);

  // Moment.JS config
  moment.locale(locale);
  moment.relativeTimeThreshold("s", 45);
  moment.relativeTimeThreshold("m", 55);
  moment.relativeTimeThreshold("h", 24);
  moment.relativeTimeThreshold("d", 31);
  moment.relativeTimeThreshold("M", 12);
  i18n.changeLanguage(language);
  await loadLSS(); // Set env handled inside

  const hideEmptyTokenAccounts = hideEmptyTokenAccountsSelector(state);
  setEnvOnAllThreads("HIDE_EMPTY_TOKEN_ACCOUNTS", hideEmptyTokenAccounts);
  const filterTokenOperationsZeroAmount = filterTokenOperationsZeroAmountSelector(state);
  setEnvOnAllThreads("FILTER_ZERO_AMOUNT_ERC20_EVENTS", filterTokenOperationsZeroAmount);

  // hydrate the store with the bridge/cache
  await Promise.allSettled(
    listCachedCurrencyIds().map(id => {
      const currency = findCryptoCurrencyById(id);
      return currency ? hydrateCurrency(currency) : null;
    }),
  );
  let accounts = await getKey("app", "accounts", []);
  if (accounts) {
    accounts = implicitMigration(accounts);
    store.dispatch(setAccounts(accounts));

    // preload currency that's not in accounts list
    if (accounts.some(a => a.currency.id !== "ethereum")) {
      prepareCurrency(getCryptoCurrencyById("ethereum"));
    }
  } else {
    store.dispatch(lock());
  }
  const initialCountervalues = await getKey("app", "countervalues");
  r(<ReactRoot store={store} language={language} initialCountervalues={initialCountervalues} />);
  const postOnboardingState = await getKey("app", "postOnboarding");
  if (postOnboardingState) {
    store.dispatch(
      importPostOnboardingState({
        newState: postOnboardingState,
      }),
    );
  }
  webFrame.setVisualZoomLevelLimits(1, 1);
  const matcher = window.matchMedia("(prefers-color-scheme: dark)");
  const updateOSTheme = () => store.dispatch(setOSDarkMode(matcher.matches));
  matcher.addListener(updateOSTheme);
  events({
    store,
  });
  window.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.which === TAB_KEY) {
      if (!isGlobalTabEnabled()) enableGlobalTab();
      logger.onTabKey(document.activeElement as HTMLElement);
    }
  });
  window.addEventListener("click", () => {
    if (isGlobalTabEnabled()) disableGlobalTab();
  });
  window.addEventListener("beforeunload", async () => {
    // This event is triggered when we reload the app, we want it to forget what it knows
    reload();
  });

  document.addEventListener(
    "dragover",
    (event: Event) => {
      event.preventDefault();
      return false;
    },
    false,
  );
  document.addEventListener(
    "drop",
    (event: Event) => {
      event.preventDefault();
      return false;
    },
    false,
  );
  if (document.body) {
    const classes = document.body.classList;
    let timer: NodeJS.Timeout | number | null = 0;
    window.addEventListener("resize", () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      } else classes.add("stop-all-transition");
      timer = setTimeout(() => {
        classes.remove("stop-all-transition");
        timer = null;
      }, 500);
    });
  }

  // expose stuff in Windows for DEBUG purpose
  window.ledger = {
    store,
    addDevice: (device: Device) => {
      store.dispatch(addDevice(device));
    },
    removeDevice: (device: Device) => {
      store.dispatch(removeDevice(device));
    },
    resetDevices: () => {
      store.dispatch(resetDevices());
    },
  };
}
function r(Comp: JSX.Element) {
  if (rootNode) {
    render(Comp, rootNode);
  }
}
init()
  .catch(e => {
    logger.critical(e);
    r(<AppError error={e} />);
  })
  .catch(error => {
    const pre = document.createElement("pre");
    pre.innerHTML = `Ledger Live crashed. Please contact Ledger support.
  ${String(error)}
  ${String((error && error.stack) || "no stacktrace")}`;
    if (document.body) {
      document.body.style.padding = "50px";
      document.body.innerHTML = "";
      document.body.appendChild(pre);
    }
  });

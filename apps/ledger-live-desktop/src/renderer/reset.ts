import { app, files } from "~/renderer/bridge";
import { useCallback } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { log } from "@ledgerhq/logs";
import { delay } from "@ledgerhq/live-common/promise";
import { useCountervaluesPolling } from "@features/platform-market-countervalues";
import { resetAll, cleanCache } from "~/renderer/storage";
import { resetStore } from "~/renderer/store";
import { cleanAccountsCache } from "~/renderer/actions/accounts";
import { disable as disableDBMiddleware } from "./middlewares/db";
import { clearBridgeCache } from "./bridge/cache";
import { persistence } from "~/persistence/composition";

function reload() {
  app.reload();
}
export async function hardReset() {
  log("clear-cache", "clearBridgeCache()");
  clearBridgeCache();
  log("clear-cache", "hardReset()");
  disableDBMiddleware();
  await persistence.stop();
  try {
    await resetAll();
    await resetStore();
  } catch (error) {
    persistence.resume();
    throw error;
  }
  window.localStorage.clear();
}
export function useHardReset() {
  return async () => {
    await hardReset();
    app.relaunch();
  };
}
export function useSoftReset() {
  const dispatch = useDispatch();
  const { wipe } = useCountervaluesPolling();
  return useCallback(async () => {
    log("clear-cache", "clearBridgeCache()");
    clearBridgeCache();
    log("clear-cache", "cleanAccountsCache()");
    await dispatch(cleanAccountsCache());
    // A failed write is already reported; the reset goes on, as the legacy debounce did.
    await persistence.flush().catch(() => undefined);
    await delay(500);
    log("clear-cache", "cleanCache()");
    await cleanCache();
    wipe();
    log("clear-cache", "reload()");
    reload();
  }, [dispatch, wipe]);
}
export async function openUserDataFolderAndQuit() {
  await files.openUserDataDirectory();
  app.quit();
}

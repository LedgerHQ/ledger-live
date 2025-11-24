import { ipcRenderer } from "electron";
import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { log } from "@ledgerhq/logs";
import { delay } from "@ledgerhq/live-common/promise";
import { useCountervaluesPolling } from "@ledgerhq/live-countervalues-react";
import { resetAll, cleanCache } from "~/renderer/storage";
import { resetStore } from "~/renderer/store";
import { cleanAccountsCache } from "~/renderer/actions/accounts";
import { disable as disableDBMiddleware } from "./middlewares/db";
import { clearBridgeCache } from "./bridge/cache";

function reload() {
  ipcRenderer.send("app-reload");
}
export async function hardReset() {
  log("clear-cache", "clearBridgeCache()");
  clearBridgeCache();
  log("clear-cache", "hardReset()");
  disableDBMiddleware();
  await resetAll();
  resetStore();
  // Preserve the hard-reset flag across localStorage.clear() so init.tsx can detect it
  const hardResetFlag = window.localStorage.getItem("hard-reset");
  window.localStorage.clear();
  if (hardResetFlag === "1") {
    window.localStorage.setItem("hard-reset", "1");
  }
}
export function useHardReset() {
  return () => {
    window.localStorage.setItem("hard-reset", "1");
    // Set a flag in sessionStorage to track that we just did a reset
    // This persists across the reload and helps with redirect logic
    window.sessionStorage.setItem("hard-reset-performed", "1");
    reload();
  };
}
export function useSoftReset() {
  const dispatch = useDispatch();
  const { wipe } = useCountervaluesPolling();
  return useCallback(async () => {
    log("clear-cache", "clearBridgeCache()");
    clearBridgeCache();
    log("clear-cache", "cleanAccountsCache()");
    dispatch(cleanAccountsCache());
    await delay(500);
    log("clear-cache", "cleanCache()");
    await cleanCache();
    wipe();
    log("clear-cache", "reload()");
    reload();
  }, [dispatch, wipe]);
}
export async function openUserDataFolderAndQuit() {
  await ipcRenderer.invoke("openUserDataDirectory");
  ipcRenderer.send("app-quit");
}

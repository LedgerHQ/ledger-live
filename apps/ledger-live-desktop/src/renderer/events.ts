import { ipcRenderer } from "electron";
import { killInternalProcess } from "./reset";
import { lock } from "./actions/application";
import { hasEncryptionKey } from "~/renderer/storage";
import logger from "./logger";
import { Store } from "redux";
const CHECK_UPDATE_DELAY = 5000;
export function sendEvent(channel: string, msgType: string, data?: unknown) {
  ipcRenderer.send(channel, {
    type: msgType,
    data,
  });
}
export default ({ store }: { store: Store }) => {
  // Ensure all sub-processes are killed before creating new ones (dev mode...)
  killInternalProcess();
  ipcRenderer.on("lock", async () => {
    if (await hasEncryptionKey("app", "accounts")) {
      store.dispatch(lock());
    }
  });
};
export function checkUpdates() {
  logger.info("Update - check");
  setTimeout(() => sendEvent("updater", "init"), CHECK_UPDATE_DELAY);
}

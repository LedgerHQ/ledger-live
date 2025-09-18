import { ipcRenderer } from "electron";
import { killInternalProcess } from "./reset";
import { lock } from "./actions/application";
import { hasEncryptionKey } from "~/renderer/storage";
import { Store } from "redux";

export default ({ store }: { store: Store }) => {
  // Ensure all sub-processes are killed before creating new ones (dev mode...)
  killInternalProcess();
  ipcRenderer.on("lock", async () => {
    if (await hasEncryptionKey("app", "accounts")) {
      store.dispatch(lock());
    }
  });
};

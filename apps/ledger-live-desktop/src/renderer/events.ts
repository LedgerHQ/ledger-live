import { ipcRenderer } from "electron";
import { lock } from "./reducers/application";
import { hasEncryptionKey } from "~/renderer/storage";
import { Store } from "redux";

export default ({ store }: { store: Store }) => {
  ipcRenderer.on("lock", async () => {
    if (await hasEncryptionKey("app", "accounts")) {
      store.dispatch(lock());
    }
  });
};

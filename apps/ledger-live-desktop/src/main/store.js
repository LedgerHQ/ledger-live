import ElectronStore from "electron-store";

export const store = new ElectronStore({
  name: "lld",
  encryptionKey: "this_only_obfuscates",
});

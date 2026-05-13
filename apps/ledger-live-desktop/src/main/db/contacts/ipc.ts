import { ipcMain } from "electron";
import { getContactsWallet, resetContactsWallet, setContactsWallet } from "./store";

export function setupContactsIpc(): void {
  ipcMain.handle("contacts:get", () => getContactsWallet());
  ipcMain.handle("contacts:set", (_event, { value }) => setContactsWallet(value));
  ipcMain.handle("contacts:reset", () => resetContactsWallet());
}

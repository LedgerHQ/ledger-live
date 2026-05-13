import { ipcRenderer } from "electron";
import { emptyPersistedContacts, type PersistedContacts } from "./types";

export const getContactsWallet = async (): Promise<PersistedContacts> => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const data = (await ipcRenderer.invoke("contacts:get")) as PersistedContacts | undefined;
  return data ?? emptyPersistedContacts();
};

export const setContactsWallet = async (value: PersistedContacts): Promise<void> => {
  await ipcRenderer.invoke("contacts:set", { value });
};

export const resetContactsWallet = async (): Promise<void> => {
  await ipcRenderer.invoke("contacts:reset");
};

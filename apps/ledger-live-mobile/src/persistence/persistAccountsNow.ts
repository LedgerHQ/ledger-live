import { selectUsesPersistence } from "@features/platform-persistence";
import { saveAccounts } from "~/db";
import { exportSelector } from "~/reducers/accounts";
import type { State } from "~/reducers/types";
import { persistence } from "./composition";

/** Saves the accounts at once, before a reboot. It rejects when the save fails. */
export async function persistAccountsNow(state: State): Promise<void> {
  if (selectUsesPersistence(state, "accounts")) {
    await persistence.flush();
    return;
  }
  await saveAccounts(await exportSelector(state));
}

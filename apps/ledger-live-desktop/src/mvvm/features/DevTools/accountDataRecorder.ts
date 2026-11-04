import { useEffect } from "react";
import { createAccountDataRecorder, type AccountDataRecorder } from "@devtools/bindings";
import { accountDataTaps } from "~/config/account-data-setup";

/** What the account data layer does, for the DevTools account-data page. */
export const accountDataRecorder = createAccountDataRecorder();

/** The recorder, plugged into the store and the sources from the first DevTools opening on. */
export function useAccountDataRecorder(): AccountDataRecorder {
  useEffect(() => accountDataTaps.observe(accountDataRecorder), []);
  return accountDataRecorder;
}

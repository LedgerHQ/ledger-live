import { createEntityAdapter } from "@reduxjs/toolkit";
import type { AccountEntry } from "./entry";

export const accountsAdapter = createEntityAdapter({
  selectId: (entry: AccountEntry) => entry.accountUUID,
});

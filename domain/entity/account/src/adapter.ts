import { createEntityAdapter } from "@reduxjs/toolkit";
import type { AccountEntry } from "./schema";

export const accountsAdapter = createEntityAdapter({
  selectId: (entry: AccountEntry) => entry.accountUUID,
});

// @flow

import { accountModel } from "../reducers/accounts";

export const importStore = (state: *) => ({
  type: "ACCOUNTS_IMPORT",
  state: {
    active:
      state && Array.isArray(state.active)
        ? state.active.map(accountModel.decode)
        : []
  }
});

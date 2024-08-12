// cover specific usecases

import "../__mocks__/environment";
import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import walletsync from "../index";
import { emptyState } from "../__mocks__";

const account1 = genAccount("specific-1");

test("applyUpdate works with accounts update", () => {
  const state = walletsync.applyUpdate(emptyState, {
    accounts: {
      hasChanges: true,
      update: {
        added: [account1],
        removed: [],
        nonImportedAccountInfos: [],
      },
    },
    accountNames: {
      hasChanges: false,
    },
  });
  expect(state).toEqual({
    ...emptyState,
    accounts: {
      list: [account1],
      nonImportedAccountInfos: [],
    },
  });
});

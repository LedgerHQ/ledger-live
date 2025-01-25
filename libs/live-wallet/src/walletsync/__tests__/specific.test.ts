// cover specific usecases

import "../__mocks__/environment";
import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import walletsync, { UpdateEvent } from "../index";
import { emptyState } from "../__mocks__";

const account1 = genAccount("specific-1");

test("applyUpdate works with accounts update", () => {
  const unchangedUpdate = Object.fromEntries(
    Object.keys(emptyState).map(key => [key, { hasChanges: false }]),
  ) as UpdateEvent;

  const state = walletsync.applyUpdate(emptyState, {
    ...unchangedUpdate,
    accounts: {
      hasChanges: true,
      update: {
        added: [account1],
        removed: [],
        nonImportedAccountInfos: [],
      },
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

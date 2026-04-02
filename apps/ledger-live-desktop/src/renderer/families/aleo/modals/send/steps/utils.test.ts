import BigNumber from "bignumber.js";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import type { AccountLike } from "@ledgerhq/types-live";
import { ALEO_ACCOUNT_1 } from "../../../__mocks__/account.mock";
import { isAleoAccount } from "./utils";

describe("isAleoAccount", () => {
  it("should return true for an account with aleoResources", () => {
    const aleoAccount: AleoAccount = {
      ...ALEO_ACCOUNT_1,
      aleoResources: {
        transparentBalance: new BigNumber(0),
        privateBalance: new BigNumber(0),
        unspentPrivateRecords: [],
        provableApi: null,
        lastPrivateSyncDate: null,
      },
    };

    expect(isAleoAccount(aleoAccount)).toBe(true);
  });

  it("should return false for a plain Account without aleoResources", () => {
    const plainAccount: AccountLike = { ...ALEO_ACCOUNT_1 };

    expect(isAleoAccount(plainAccount)).toBe(false);
  });
});

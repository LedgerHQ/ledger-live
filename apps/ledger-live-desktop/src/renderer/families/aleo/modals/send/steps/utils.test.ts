import BigNumber from "bignumber.js";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import type { AccountLike } from "@ledgerhq/types-live";
import type { TFunction } from "i18next";
import { ALEO_ACCOUNT_1 } from "../../../__mocks__/account.mock";
import { isAleoAccount, getEstimatedSigningTime } from "./utils";

const t = ((key: string) => key) as TFunction;

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

describe("getEstimatedSigningTime", () => {
  // SIGNING_RECORDS_TIME = 12500 ms per record

  it("should return seconds for totals below 1 minute", () => {
    // 4 records × 12500 ms = 50 000 ms = 50 s
    expect(getEstimatedSigningTime(4, t)).toBe("~50 time.second_short");
  });

  it("should round seconds correctly for non-integer results", () => {
    // 1 record × 12500 ms = 12.5 s → rounds to 13
    expect(getEstimatedSigningTime(1, t)).toBe("~13 time.second_short");
  });

  it("should return minutes floored to 0.5 min for totals >= 1 minute", () => {
    // 5 records × 12500 ms = 62.5 s → floor to 60 s = 1 min
    expect(getEstimatedSigningTime(5, t)).toBe("~1 time.minute_short");
  });

  it("should floor to nearest 30 s above 1 minute", () => {
    // 8 records × 12500 ms = 100 s → floor to 90 s = 1.5 min
    expect(getEstimatedSigningTime(8, t)).toBe("~1.5 time.minute_short");
  });

  it("should floor to 2 min when total is just above 2 minutes", () => {
    // 10 records × 12500 ms = 125 s → floor to 120 s = 2 min
    expect(getEstimatedSigningTime(10, t)).toBe("~2 time.minute_short");
  });

  it("should show 2.5 min when total lands exactly on 150 s", () => {
    // 12 records × 12500 ms = 150 s → floor to 150 s = 2.5 min
    expect(getEstimatedSigningTime(12, t)).toBe("~2.5 time.minute_short");
  });

  it("should return 0 sec for 0 records", () => {
    expect(getEstimatedSigningTime(0, t)).toBe("~0 time.second_short");
  });
});

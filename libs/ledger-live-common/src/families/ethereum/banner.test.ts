import { getAccountBannerState } from "./banner";
import { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";

describe("getAccountBannerState", () => {
  it("returns lido when account has less than 32 ETH", () => {
    const state = getAccountBannerState({
      balance: new BigNumber("10000000000000000000"),
      currency: {
        id: "ethereum",
      },
    } as Account);
    expect(state).toEqual({
      stakeProvider: "lido",
    });
  });

  it("returns kiln when account has more than 32 ETH", () => {
    const state = getAccountBannerState({
      balance: new BigNumber("32000000000000000000"),
      currency: {
        id: "ethereum",
      },
    } as Account);
    expect(state).toEqual({
      stakeProvider: "kiln",
    });
  });
});

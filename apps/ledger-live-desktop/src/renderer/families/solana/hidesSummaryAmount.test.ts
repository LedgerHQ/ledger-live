import type { Transaction } from "@ledgerhq/live-common/families/solana/types";
import { hidesSummaryAmount } from "./hidesSummaryAmount";

const makeTransaction = (raw?: string) => ({ family: "solana", raw }) as unknown as Transaction;

describe("solana hidesSummaryAmount", () => {
  it("returns true for a raw transaction", () => {
    expect(hidesSummaryAmount(makeTransaction("base64-tx"))).toEqual(true);
  });

  it("returns false for a transaction without raw", () => {
    expect(hidesSummaryAmount(makeTransaction())).toEqual(false);
  });
});

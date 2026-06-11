import BigNumber from "bignumber.js";
import type { Account, Operation } from "@ledgerhq/types-live";
import type { MappedSwapOperation } from "../swap/types";
import { fromSwapOperation } from "./fromSwapOperation";

function makeAccount(id: string): Account {
  return { type: "Account", id } as unknown as Account;
}

describe("fromSwapOperation", () => {
  it("maps a swap-history operation to the reduced transaction status request", () => {
    const operation = {
      hash: "0xhash",
      fee: new BigNumber("21000"),
      date: new Date("2026-01-02T03:04:05.000Z"),
    } as unknown as Operation;

    const mapped: MappedSwapOperation = {
      provider: "lifi",
      swapId: "swap-1",
      status: "finished",
      fromAccount: makeAccount("from"),
      toAccount: makeAccount("to"),
      toExists: true,
      operation,
      fromAmount: new BigNumber("-100000"),
      toAmount: new BigNumber("200000"),
      finalAmount: new BigNumber("250000"),
    };

    expect(fromSwapOperation(mapped)).toEqual({
      swapId: "swap-1",
      provider: "lifi",
    });
  });
});

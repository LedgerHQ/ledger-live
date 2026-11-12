import BigNumber from "bignumber.js";
import type { SwapOperation } from "@ledgerhq/types-live";
import type { SwapStatus } from "../../../exchange/swap/types";
import { genAccount } from "../../../mock/account";
import { mapWithdrawSwapEntry } from "./withdrawSwapEntry";

const receiver = genAccount("receiver", { operationsSize: 0 });
const magnitude = receiver.currency.units[0].magnitude;

const entry: SwapOperation = {
  provider: "swapkit_hyperliquid",
  swapId: "swap-id",
  status: "pending",
  receiverAccountId: receiver.id,
  fromAccountId: "hypercore",
  operationId: "",
  fromAmount: new BigNumber(5),
  toAmount: new BigNumber(1),
  finalAmount: new BigNumber(2),
};

const status = (finalAmount: string): SwapStatus => ({
  provider: "swapkit_hyperliquid",
  swapId: "swap-id",
  status: "finished",
  finalAmount,
});

describe("mapWithdrawSwapEntry", () => {
  it("uses the final amount of the swap status", () => {
    const result = mapWithdrawSwapEntry(entry, [receiver], status("3"));
    expect(result.finalAmount).toBe(new BigNumber(3).shiftedBy(magnitude).toFixed());
  });

  it.each(["", "abc"])("falls back to the stored final amount when the status has %p", value => {
    const result = mapWithdrawSwapEntry(entry, [receiver], status(value));
    expect(result.finalAmount).toBe(new BigNumber(2).shiftedBy(magnitude).toFixed());
  });
});

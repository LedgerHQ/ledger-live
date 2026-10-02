import {
  NotEnoughBalance,
  NotEnoughBalanceInParentAccount,
  NotEnoughSpendableBalance,
} from "@ledgerhq/ledger-wallet-framework/errors";
import { CompleteExchangeError } from "@ledgerhq/live-common/exchange/error";
import { isNotEnoughBalance } from "../isNotEnoughBalance";

describe("isNotEnoughBalance", () => {
  it.each([
    ["the bridge", new NotEnoughBalance()],
    ["the bridge, once fees are reserved", new NotEnoughSpendableBalance()],
  ])("recognises a shortfall reported by %s", (_case, error) => {
    expect(isNotEnoughBalance(error)).toBe(true);
  });

  it("recognises a shortfall wrapped by executeSwap, which keeps the name as the title", () => {
    const bridgeError = new NotEnoughBalance("Insufficient balance");
    const error = new CompleteExchangeError("INIT", bridgeError.name, bridgeError.message);

    expect(isNotEnoughBalance(error)).toBe(true);
  });

  it("recognises a shortfall wrapped by the Exchange app, which keeps only the message", () => {
    const bridgeError = new NotEnoughBalance();
    const error = new CompleteExchangeError("INIT", "amount", bridgeError.message);

    expect(isNotEnoughBalance(error)).toBe(true);
  });

  it.each([
    ["a plain failure", new Error("boom")],
    [
      "a parent account short on fees, which a lower amount cannot fix",
      new NotEnoughBalanceInParentAccount(),
    ],
    [
      "an Exchange failure that is not a shortfall",
      new CompleteExchangeError("INIT", "internalError", "boom"),
    ],
    ["nothing at all", undefined],
    ["a string", "NotEnoughBalance"],
  ])("does not mistake %s for a shortfall", (_case, error) => {
    expect(isNotEnoughBalance(error)).toBe(false);
  });
});

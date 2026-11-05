import {
  NotEnoughBalance,
  NotEnoughBalanceFees,
  NotEnoughBalanceInParentAccount,
  NotEnoughGas,
  NotEnoughSpendableBalance,
} from "@ledgerhq/ledger-wallet-framework/errors";
import { CompleteExchangeError } from "./error";
import { isNotEnoughBalance } from "./isNotEnoughBalance";

describe("isNotEnoughBalance", () => {
  it.each([
    ["the bridge", new NotEnoughBalance()],
    ["the bridge, once fees are reserved", new NotEnoughSpendableBalance()],
    ["an EVM bridge short on gas", new NotEnoughGas()],
    ["a token bridge whose parent account is short on fees", new NotEnoughBalanceInParentAccount()],
    ["the Aptos, Celo and Sui bridges short on fees", new NotEnoughBalanceFees()],
  ])("recognises a shortfall reported by %s", (_case, error) => {
    expect(isNotEnoughBalance(error)).toBe(true);
  });

  it("recognises a shortfall wrapped by executeSwap, which keeps the name as the title", () => {
    const bridgeError = new NotEnoughBalance("Insufficient balance");
    const error = new CompleteExchangeError("INIT", bridgeError.name, bridgeError.message);

    expect(isNotEnoughBalance(error)).toBe(true);
  });

  it.each([NotEnoughGas, NotEnoughBalanceInParentAccount, NotEnoughBalanceFees])(
    "recognises a %p shortfall wrapped by executeSwap",
    ErrorClass => {
      const bridgeError = new ErrorClass();
      const error = new CompleteExchangeError("INIT", bridgeError.name, "");

      expect(isNotEnoughBalance(error)).toBe(true);
    },
  );

  it.each(["TonNotEnoughBalanceInParentAccount", "CardanoNotEnoughFunds", "NotEnoughEGLDForFees"])(
    "recognises the %s family shortfall wrapped by executeSwap",
    familyErrorName => {
      const error = new CompleteExchangeError("INIT", familyErrorName, "");

      expect(isNotEnoughBalance(error)).toBe(true);
    },
  );

  it("recognises a shortfall wrapped by the Exchange app, which keeps only the message", () => {
    const bridgeError = new NotEnoughBalance();
    const error = new CompleteExchangeError("INIT", "amount", bridgeError.message);

    expect(isNotEnoughBalance(error)).toBe(true);
  });

  it.each([
    ["a plain failure", new Error("boom")],
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

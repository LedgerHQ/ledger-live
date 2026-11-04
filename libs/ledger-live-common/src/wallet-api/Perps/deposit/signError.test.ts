import { AddressesSanctionedError } from "@ledgerhq/ledger-wallet-framework/sanction/errors";
import { NotEnoughGas } from "@ledgerhq/ledger-wallet-framework/errors";
import { CompleteExchangeError } from "../../../exchange/error";
import { PayloadStepError, SignatureStepError } from "../../Exchange/SwapError";
import type { AccountLike } from "@ledgerhq/types-live";
import {
  isDepositGenericSignError,
  shouldReturnToDepositForm,
  toDepositSignErrorStep,
} from "./signError";

describe("isDepositGenericSignError", () => {
  it.each([
    ["a failed payload request", new PayloadStepError(new Error("500"))],
    ["a sanctions refusal", new AddressesSanctionedError()],
    [
      "a sanctions refusal wrapped by executeSwap",
      new CompleteExchangeError("INIT", "AddressesSanctionedError", "AddressesSanctionedError"),
    ],
  ])("recognises %s", (_case, error) => {
    expect(isDepositGenericSignError(error)).toBe(true);
  });

  it.each([
    ["a signature failure", new SignatureStepError(new Error("boom"))],
    ["an Exchange failure", new CompleteExchangeError("INIT", "internalError", "boom")],
    ["a message that only mentions the name", new Error("PayloadStepError")],
    ["nothing at all", undefined],
    ["a string", "PayloadStepError"],
  ])("does not mistake %s for a generic failure", (_case, error) => {
    expect(isDepositGenericSignError(error)).toBe(false);
  });
});

describe("shouldReturnToDepositForm", () => {
  it.each([
    ["a generic failure", new PayloadStepError()],
    ["a shortfall", new CompleteExchangeError("INIT", new NotEnoughGas().name, "")],
  ])("sends %s back to the form", (_case, error) => {
    expect(shouldReturnToDepositForm(error)).toBe(true);
  });

  it("keeps any other failure on the sign step", () => {
    expect(shouldReturnToDepositForm(new Error("boom"))).toBe(false);
  });
});

describe("toDepositSignErrorStep", () => {
  const accounts = {
    depositAccount: { type: "Account", currency: { ticker: "ETH" } } as unknown as AccountLike,
    receiverAccount: { type: "Account", currency: { ticker: "USDC" } } as unknown as AccountLike,
  };

  it("tracks a generic failure and marks the step as generic", () => {
    const track = jest.fn();
    const error = new PayloadStepError();

    expect(toDepositSignErrorStep(error, { ...accounts, track })).toEqual({
      kind: "error",
      error,
      isGeneric: true,
    });
    expect(track).toHaveBeenCalledWith("swap error message", {
      message: "deposit_sign_failed",
      page: "perps_deposit_sign",
      flow: "perps",
      sourceCurrency: "ETH",
      targetCurrency: "USDC",
    });
  });

  it("keeps any other failure as it is, without an event", () => {
    const track = jest.fn();

    expect(toDepositSignErrorStep("boom", { ...accounts, track })).toEqual({
      kind: "error",
      error: new Error("boom"),
      isGeneric: false,
    });
    expect(track).not.toHaveBeenCalled();
  });
});

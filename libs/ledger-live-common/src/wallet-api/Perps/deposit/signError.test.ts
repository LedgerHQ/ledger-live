import { AddressesSanctionedError } from "@ledgerhq/ledger-wallet-framework/sanction/errors";
import { NotEnoughGas } from "@ledgerhq/ledger-wallet-framework/errors";
import { CompleteExchangeError } from "../../../exchange/error";
import { PayloadStepError, SignatureStepError } from "../../Exchange/SwapError";
import type { AccountLike } from "@ledgerhq/types-live";
import {
  isDepositGenericSignError,
  getDepositSignFailedEvent,
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
  it("marks a generic failure, which also returns to the form", () => {
    const error = new PayloadStepError();

    expect(toDepositSignErrorStep(error)).toEqual({
      kind: "error",
      error,
      isGeneric: true,
      returnsToForm: true,
    });
  });

  it("marks a shortfall as a return to the form, without the generic copy", () => {
    const error = new CompleteExchangeError("INIT", new NotEnoughGas().name, "");

    expect(toDepositSignErrorStep(error)).toMatchObject({ isGeneric: false, returnsToForm: true });
  });

  it("keeps any other failure on the sign step", () => {
    expect(toDepositSignErrorStep("boom")).toEqual({
      kind: "error",
      error: new Error("boom"),
      isGeneric: false,
      returnsToForm: false,
    });
  });
});

describe("getDepositSignFailedEvent", () => {
  it("describes the generic failure for the swap error analytics", () => {
    const depositAccount = {
      type: "Account",
      currency: { ticker: "ETH" },
    } as unknown as AccountLike;
    const receiverAccount = {
      type: "Account",
      currency: { ticker: "USDC" },
    } as unknown as AccountLike;

    expect(getDepositSignFailedEvent(depositAccount, receiverAccount)).toEqual({
      message: "deposit_sign_failed",
      page: "perps_deposit_sign",
      flow: "perps",
      sourceCurrency: "ETH",
      targetCurrency: "USDC",
    });
  });
});

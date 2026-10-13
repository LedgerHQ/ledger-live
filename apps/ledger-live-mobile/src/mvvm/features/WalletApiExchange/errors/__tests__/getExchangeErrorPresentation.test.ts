import { CompleteExchangeError } from "@ledgerhq/live-common/exchange/error";
import { renderHook } from "@tests/test-renderer";
import { useTranslation } from "~/context/Locale";
import { getExchangeErrorPresentation } from "../getExchangeErrorPresentation";

function present(error: unknown) {
  const { result } = renderHook(() => useTranslation());
  const { t } = result.current;
  return { t, presentation: getExchangeErrorPresentation(error, t) };
}

describe("getExchangeErrorPresentation", () => {
  it("uses the reason the swap backend gave, before anything else", () => {
    const error = Object.assign(new CompleteExchangeError("INIT", "invalidAddress", "message"), {
      cause: { response: { data: { error: { messageKey: "WRONG_OR_EXPIRED_RATE_ID" } } } },
    });

    const { t, presentation } = present(error);

    expect(presentation.title).toBe(t("swapErrors.swapRateExpiredError.title"));
    expect(presentation.description).toBe(t("swapErrors.swapRateExpiredError.description"));
  });

  it("reads the backend reason from the cause of a swap error too", () => {
    const error = Object.assign(new Error("failed"), {
      cause: { messageKey: "SWAP_QUOTE_LOW_LIQUIDITY" },
    });

    const { t, presentation } = present(error);

    expect(presentation.title).toBe(t("swapErrors.swapQuoteLowLiquidity.title"));
  });

  it("gives a support code to quote when the transaction cannot be created", () => {
    const error = Object.assign(new Error("failed"), {
      cause: { messageKey: "TRANSACTION_CANNOT_BE_CREATED" },
    });

    const { t, presentation } = present(error);

    expect(presentation.title).toBe(t("swapErrors.transactionCannotBeCreated.title"));
    expect(presentation.description).not.toContain("{{randomCode}}");
    expect(presentation.description).not.toBe("");
  });

  it("uses the copy of the step an exchange error names", () => {
    const error = new CompleteExchangeError(
      "CHECK_PAYOUT_ADDRESS",
      "WrongDeviceForAccountPayout",
      "message",
    );

    const { t, presentation } = present(error);

    expect(presentation.title).toBe(t("swapErrors.WrongDeviceForAccountPayout.title"));
    expect(presentation.description).toBe(t("swapErrors.WrongDeviceForAccountPayout.description"));
  });

  it("uses the copy of the name of any other error", () => {
    const error = Object.assign(new Error("message"), { name: "invalidAddress" });

    const { t, presentation } = present(error);

    expect(presentation.title).toBe(t("swapErrors.invalidAddress.title"));
  });

  it("falls back to the app's standard copy of an error the swap has none for", () => {
    const error = new CompleteExchangeError("INIT", "DisconnectedDeviceDuringOperation", "x");

    const { t, presentation } = present(error);

    expect(presentation.title).toBe(t("errors.DisconnectedDeviceDuringOperation.title"));
    expect(presentation.description).toBe(
      t("errors.DisconnectedDeviceDuringOperation.description"),
    );
  });

  it("fills the standard copy with the error's own fields", () => {
    const error = Object.assign(new Error("message"), {
      name: "AleoBondAmountTooLow",
      minAmount: "10 ALEO",
    });

    const { presentation } = present(error);

    expect(presentation.title).toContain("10 ALEO");
  });

  it("does not take the name of an exchange error for a copy key", () => {
    const { t, presentation } = present(new CompleteExchangeError("INIT", undefined, "It broke"));

    expect(presentation.title).toBe("It broke");
    expect(presentation.description).toBe(t("swapErrors.default.description"));
  });

  it("falls back to the message of an error it has no copy for", () => {
    const { t, presentation } = present(new Error("Something odd happened"));

    expect(presentation.title).toBe("Something odd happened");
    expect(presentation.description).toBe(t("swapErrors.default.description"));
  });

  it("uses the generic text when there is nothing to say", () => {
    const { t, presentation } = present(undefined);

    expect(presentation.title).toBe(t("swapErrors.default.title"));
    expect(presentation.description).toBe(t("swapErrors.default.description"));
  });

  it("reports the swap code and the reference id for support", () => {
    const error = Object.assign(new Error("failed"), {
      cause: { swapCode: "swap001", correlationId: "abc123" },
    });

    expect(present(error).presentation).toEqual(
      expect.objectContaining({ swapCode: "swap001", correlationId: "abc123" }),
    );
  });

  it("has no code or reference id when the error carries none", () => {
    expect(present(new Error("failed")).presentation).toEqual(
      expect.objectContaining({ swapCode: null, correlationId: null }),
    );
  });
});

import { TransportStatusError } from "@ledgerhq/errors";
import { ErrorStatus } from "@ledgerhq/hw-app-exchange/ReturnCode";
import { CompleteExchangeError } from "../error";
import {
  enrichSwapDeserializationError,
  shouldForceZeroAmountForDexSwap,
} from "./completeExchange";

describe("shouldForceZeroAmountForDexSwap", () => {
  const base = {
    isDex: true,
    family: "evm",
    hasSubAccountId: false,
    fromCurrencyId: "ethereum",
  };

  it.each([
    ["EVM DEX swap from arc_testnet", { fromCurrencyId: "arc_testnet" }, true],
    ["EVM DEX swap from arc", { fromCurrencyId: "arc" }, true],
    ["EVM DEX swap from a token sub-account", { hasSubAccountId: true }, true],
    ["provider is not a DEX", { isDex: false, fromCurrencyId: "arc_testnet" }, false],
    ["family is not evm", { family: "bitcoin", fromCurrencyId: "arc" }, false],
    ["non-Arc native coin without sub-account", {}, false],
  ])("%s", (_case, params, expected) => {
    expect(shouldForceZeroAmountForDexSwap({ ...base, ...params })).toBe(expected);
  });
});

describe("enrichSwapDeserializationError", () => {
  // Minimal NewTransactionResponse protobuf with only payin_extra_id (field 2) = 40 * "a",
  // which is above the device's 19-byte usable limit for that field.
  const payloadWithOversizedExtraId = "1228" + "61".repeat(40);

  it("enriches a device DESERIALIZATION_FAILED with the precise offending field", () => {
    const deviceError = new TransportStatusError(ErrorStatus.DESERIALIZATION_FAILED);

    const result = enrichSwapDeserializationError(
      "PROCESS_TRANSACTION",
      payloadWithOversizedExtraId,
      deviceError,
    );

    expect(result).toBeInstanceOf(CompleteExchangeError);
    // Title stays the device error's translation key so the user-facing copy is unchanged;
    // the precise field only enriches the message (logs/analytics).
    expect(result).toMatchObject({
      step: "PROCESS_TRANSACTION",
      title: "deserializationFailed",
    });
    expect(result?.message).toContain("payin_extra_id");
  });

  it("returns undefined for a DESERIALIZATION_FAILED when no field violation is found", () => {
    const deviceError = new TransportStatusError(ErrorStatus.DESERIALIZATION_FAILED);
    // Payload cannot be decoded locally -> defer to the device's generic error.
    expect(
      enrichSwapDeserializationError("PROCESS_TRANSACTION", "0aff", deviceError),
    ).toBeUndefined();
  });

  it("returns undefined for unrelated device status codes", () => {
    const deviceError = new TransportStatusError(ErrorStatus.INVALID_ADDRESS);
    expect(
      enrichSwapDeserializationError(
        "CHECK_REFUND_ADDRESS",
        payloadWithOversizedExtraId,
        deviceError,
      ),
    ).toBeUndefined();
  });

  it("returns undefined for non-transport errors", () => {
    expect(
      enrichSwapDeserializationError(
        "PROCESS_TRANSACTION",
        payloadWithOversizedExtraId,
        new Error("boom"),
      ),
    ).toBeUndefined();
  });
});

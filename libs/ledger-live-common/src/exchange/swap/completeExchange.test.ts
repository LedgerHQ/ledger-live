import { TransportStatusError } from "@ledgerhq/hw-transport/errors";
import { ErrorStatus } from "@ledgerhq/hw-app-exchange/ReturnCode";
import BigNumber from "bignumber.js";
import { CompleteExchangeError } from "../error";
import {
  enrichEvmNotEnoughGasError,
  enrichNotEnoughBalanceError,
  enrichSwapDeserializationError,
  getBufferedDexGasLimit,
  shouldForceZeroAmountForDexSwap,
  shouldSendArcAsAliasTransfer,
} from "./completeExchange";

describe("getBufferedDexGasLimit", () => {
  it.each([
    ["caps HyperEVM at 2.9M", "hyperevm", 3_000_000, "2900000"],
    ["keeps a buffered HyperEVM value below the cap", "hyperevm", 2_000_000, "2600000"],
    ["does not cap other EVM currencies", "ethereum", 3_000_000, "3900000"],
  ])("%s", (_case, fromCurrencyId, gasLimit, expected) => {
    expect(
      getBufferedDexGasLimit({
        gasLimit: new BigNumber(gasLimit),
        fromCurrencyId,
      }).toFixed(),
    ).toBe(expected);
  });
});

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

describe("shouldSendArcAsAliasTransfer", () => {
  const base = {
    isDex: false,
    family: "evm",
    hasSubAccountId: false,
    fromCurrencyId: "arc",
  };

  it.each([
    ["non-DEX swap from arc", {}, true],
    ["non-DEX swap from an arc token sub-account", { hasSubAccountId: true }, false],
    ["non-DEX swap from arc_testnet", { fromCurrencyId: "arc_testnet" }, true],
    ["DEX swap from arc", { isDex: true }, false],
    ["family is not evm", { family: "bitcoin" }, false],
    ["non-Arc currency", { fromCurrencyId: "ethereum" }, false],
  ])("%s", (_case, params, expected) => {
    expect(shouldSendArcAsAliasTransfer({ ...base, ...params })).toEqual(expected);
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

describe("enrichEvmNotEnoughGasError", () => {
  const context = {
    family: "evm",
    nativeBalance: new BigNumber("1500000000000000000"),
    nativeCurrency: "POL",
    totalFees: new BigNumber("210000000000000"),
    gasLimit: new BigNumber("21000"),
    gasPrice: new BigNumber("10000000000"),
  };

  it("attaches native balance, fees, and legacy gas fields for an EVM NotEnoughGas error", () => {
    const error = new Error("NotEnoughGas");
    error.name = "NotEnoughGas";

    const result = enrichEvmNotEnoughGasError(error, context);

    expect(result).toBe(error);
    expect(result).toMatchObject({
      nativeBalance: "1500000000000000000",
      nativeCurrency: "POL",
      totalFees: "210000000000000",
      gasLimit: "21000",
      gasPrice: "10000000000",
    });
    expect(result).not.toHaveProperty("maxFeePerGas");
  });

  it("attaches EIP-1559 fee fields when gasPrice is absent", () => {
    const error = new Error("NotEnoughGas");
    error.name = "NotEnoughGas";

    const result = enrichEvmNotEnoughGasError(error, {
      ...context,
      gasPrice: undefined,
      maxFeePerGas: new BigNumber("20000000000"),
      maxPriorityFeePerGas: new BigNumber("1000000000"),
    });

    expect(result).toMatchObject({
      gasLimit: "21000",
      maxFeePerGas: "20000000000",
      maxPriorityFeePerGas: "1000000000",
    });
    expect(result).not.toHaveProperty("gasPrice");
  });

  it("leaves a non-EVM NotEnoughGas error unchanged", () => {
    const error = new Error("NotEnoughGas");
    error.name = "NotEnoughGas";

    const result = enrichEvmNotEnoughGasError(error, { ...context, family: "solana" });

    expect(result).toBe(error);
    expect(result).not.toHaveProperty("nativeBalance");
    expect(result).not.toHaveProperty("totalFees");
  });

  it("leaves another EVM error unchanged", () => {
    const error = new Error("AmountRequired");
    error.name = "AmountRequired";

    const result = enrichEvmNotEnoughGasError(error, context);

    expect(result).toBe(error);
    expect(result).not.toHaveProperty("nativeBalance");
    expect(result).not.toHaveProperty("gasLimit");
  });
});

describe("enrichNotEnoughBalanceError", () => {
  const context = {
    balance: new BigNumber("67249598693"),
    spendableBalance: new BigNumber("67249000000"),
    pendingOperationsCount: 2,
    unit: {
      name: "USD Coin",
      code: "USDC",
      magnitude: 6,
    },
  };

  it("attaches balance, spendable balance, and pending operation count", () => {
    const error = new Error("NotEnoughBalance");
    error.name = "NotEnoughBalance";

    const result = enrichNotEnoughBalanceError(error, context);

    expect(result).toBe(error);
    expect(result).toMatchObject({
      balance: "67249.598693",
      spendableBalance: "67249",
      pendingOperationsCount: "2",
    });
    expect(result).not.toHaveProperty("nativeBalance");
  });

  it("keeps a pending operation count of zero", () => {
    const error = new Error("NotEnoughBalance");
    error.name = "NotEnoughBalance";

    const result = enrichNotEnoughBalanceError(error, { ...context, pendingOperationsCount: 0 });

    expect(result).toMatchObject({ pendingOperationsCount: "0" });
  });

  it("leaves another error unchanged", () => {
    const error = new Error("NotEnoughGas");
    error.name = "NotEnoughGas";

    const result = enrichNotEnoughBalanceError(error, context);

    expect(result).toBe(error);
    expect(result).not.toHaveProperty("balance");
    expect(result).not.toHaveProperty("spendableBalance");
    expect(result).not.toHaveProperty("pendingOperationsCount");
  });
});

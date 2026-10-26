import { TransportStatusError } from "@ledgerhq/hw-transport/errors";
import { ErrorStatus } from "@ledgerhq/hw-app-exchange/ReturnCode";
import { CardanoNotEnoughFunds } from "@ledgerhq/coin-cardano/errors";
import {
  InvalidTransactionError,
  NotEnoughBalance,
  NotEnoughGas,
  NotEnoughSpendableBalance,
} from "@ledgerhq/ledger-wallet-framework/errors";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { CompleteExchangeError } from "../error";
import {
  enrichInsufficientFundsError,
  enrichSwapDeserializationError,
  getBufferedDexGasLimit,
  readInsufficientFundsDiagnostics,
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

describe("enrichInsufficientFundsError", () => {
  const parentAccount = {
    type: "Account",
    currency: { ticker: "POL", units: [{ name: "POL", code: "POL", magnitude: 18 }] },
    balance: new BigNumber("1500000000000000000"),
    spendableBalance: new BigNumber("1500000000000000000"),
    pendingOperations: [],
  } as unknown as Account;

  const tokenAccount = {
    type: "TokenAccount",
    token: { units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }] },
    balance: new BigNumber("67249598693"),
    spendableBalance: new BigNumber("67249000000"),
    pendingOperations: [{}, {}],
  } as unknown as TokenAccount;

  const context = { account: tokenAccount, parentAccount };

  it.each([
    ["an EVM gas shortfall", new NotEnoughGas()],
    ["a balance shortfall", new NotEnoughBalance()],
    ["a balance shortfall once fees are reserved", new NotEnoughSpendableBalance()],
    ["a Cardano shortfall", new CardanoNotEnoughFunds()],
    ["a Solana shortfall raised at broadcast", new InvalidTransactionError("Insufficient funds")],
    ["an XRP shortfall raised at broadcast", new Error("Insufficient XRP balance to send.")],
  ])("attaches the account balances to %s", (_case, error) => {
    const result = enrichInsufficientFundsError(error, context);

    expect(result).toBe(error);
    expect(result).toMatchObject({
      balance: "67249.598693",
      spendableBalance: "67249",
      pendingOperationsCount: "2",
      nativeBalance: "1.5",
      nativeCurrency: "POL",
    });
    expect(result).not.toHaveProperty("maxSpendable");
  });

  it("formats the max spendable in the account unit", () => {
    const result = enrichInsufficientFundsError(new NotEnoughBalance(), {
      ...context,
      maxSpendable: new BigNumber("67248500000"),
    });

    expect(result).toMatchObject({ maxSpendable: "67248.5" });
  });

  it("keeps a pending operation count of zero", () => {
    const result = enrichInsufficientFundsError(new NotEnoughBalance(), {
      ...context,
      account: { ...tokenAccount, pendingOperations: [] },
    });

    expect(result).toMatchObject({ pendingOperationsCount: "0" });
  });

  it("attaches the fees and legacy gas fields of the transaction", () => {
    const result = enrichInsufficientFundsError(new NotEnoughGas(), {
      ...context,
      totalFees: new BigNumber("210000000000000"),
      transaction: {
        gasLimit: new BigNumber("21000"),
        gasPrice: new BigNumber("10000000000"),
      },
    });

    expect(result).toMatchObject({
      totalFees: "0.00021",
      gasLimit: "21000",
      gasPrice: "10000000000",
    });
    expect(result).not.toHaveProperty("maxFeePerGas");
  });

  it("attaches EIP-1559 fee fields and prefers the custom gas limit", () => {
    const result = enrichInsufficientFundsError(new NotEnoughGas(), {
      ...context,
      transaction: {
        gasLimit: new BigNumber("21000"),
        customGasLimit: new BigNumber("27300"),
        maxFeePerGas: new BigNumber("20000000000"),
        maxPriorityFeePerGas: new BigNumber("1000000000"),
      },
    });

    expect(result).toMatchObject({
      gasLimit: "27300",
      maxFeePerGas: "20000000000",
      maxPriorityFeePerGas: "1000000000",
    });
    expect(result).not.toHaveProperty("gasPrice");
  });

  it.each([
    ["an unrelated error", new Error("AmountRequired")],
    ["a failed balance lookup", new Error("Failed to fetch balance")],
    ["a gas fee error", new Error("max fee per gas less than block base fee")],
    [
      "a gas adjustment error",
      Object.assign(new Error("invalid gas adjustment"), {
        name: "CosmosBroadcastInvalidGasAdjustment",
      }),
    ],
  ])("leaves %s unchanged", (_case, error) => {
    const result = enrichInsufficientFundsError(error, context);

    expect(result).toBe(error);
    expect(result).not.toHaveProperty("balance");
    expect(result).not.toHaveProperty("nativeBalance");
  });
});

describe("readInsufficientFundsDiagnostics", () => {
  it("reads back the string diagnostics of a shortfall", () => {
    const error = Object.assign(new NotEnoughBalance(), {
      balance: "1.5",
      maxSpendable: "1.2",
      totalFees: new BigNumber("1000"),
    });

    expect(readInsufficientFundsDiagnostics(error)).toEqual({
      balance: "1.5",
      maxSpendable: "1.2",
    });
  });

  it("ignores an error that is not a shortfall", () => {
    const error = Object.assign(new Error("boom"), { balance: "1.5" });

    expect(readInsufficientFundsDiagnostics(error)).toEqual({});
  });
});

import BigNumber from "bignumber.js";

import type { RawQuote } from "../service/types";
import {
  APPROVAL_GAS_LIMIT,
  computeFeeEstimate,
  type NetworkFeeContext,
} from "./networkFeeEstimate";

/**
 * Mid-sized EVM defaults: 18 magnitude (ether), a 25 gwei maxFeePerGas,
 * a 400,000-gas default limit (matches prod spread for swaps), and a
 * 1 ETH spendable balance. Tests override only the fields they exercise.
 */
function makeEvmContext(overrides: Partial<NetworkFeeContext> = {}): NetworkFeeContext {
  return {
    maxFeePerGas: new BigNumber("25000000000"), // 25 gwei
    gasPrice: undefined,
    defaultGasLimit: "400000",
    estimatedFeesAtomic: new BigNumber("10000000000000000"), // 0.01 ETH
    balanceAtomic: new BigNumber("1000000000000000000"), // 1 ETH
    feeCurrencyId: "ethereum",
    feeCurrencyMagnitude: 18,
    mainAccountCurrencyId: "ethereum",
    ...overrides,
  };
}

function makeRawQuote(overrides: Partial<RawQuote> = {}): RawQuote {
  return {
    provider: "lifi",
    providerType: "DEX",
    type: "float",
    amountFrom: 50,
    amountTo: 49.9,
    exchangeRate: 0.998,
    slippage: 0,
    networkFees: { currency: "ethereum", value: 0.005, gasLimit: "250000" },
    tags: { isRegistrationRequired: false, isTokenApprovalRequired: false },
    key: "lifi-float-ethereum",
    liquiditySource: "AMM",
    ...overrides,
  };
}

describe("computeFeeEstimate — EVM path", () => {
  it("emits estimatedNetworkFee only when no approval is needed", () => {
    const result = computeFeeEstimate(makeRawQuote(), makeEvmContext());

    expect(result.estimatedNetworkFee).toEqual({
      // 250_000 * 25 gwei = 6_250_000 gwei = 6.25e15 wei
      amount: "6250000000000000",
      currencyId: "ethereum",
    });
    expect(result.approvalNetworkFee).toBeUndefined();
  });

  it("emits both fields when a token approval is required", () => {
    const result = computeFeeEstimate(
      makeRawQuote({ tokenAllowanceData: { isApproved: false } }),
      makeEvmContext(),
    );

    expect(result.estimatedNetworkFee?.amount).toBe("6250000000000000");
    expect(result.approvalNetworkFee).toEqual({
      // APPROVAL_GAS_LIMIT * 25 gwei = 60_000 * 25e9 = 1.5e15 wei
      amount: "1500000000000000",
      currencyId: "ethereum",
    });
  });

  it("emits approvalNetworkFee only for gasless quotes that still need approval", () => {
    const result = computeFeeEstimate(
      makeRawQuote({
        provider: "oneinchfusion",
        tokenAllowanceData: { isApproved: false },
      }),
      makeEvmContext(),
    );

    expect(result.estimatedNetworkFee).toBeUndefined();
    expect(result.approvalNetworkFee?.amount).toBe("1500000000000000");
  });

  it("emits neither field for a fully gasless quote with no approval needed", () => {
    const result = computeFeeEstimate(
      makeRawQuote({ provider: "oneinchfusion" }),
      makeEvmContext(),
    );

    expect(result.estimatedNetworkFee).toBeUndefined();
    expect(result.approvalNetworkFee).toBeUndefined();
  });

  it("treats oneinchfusion rows as gasless even when the raw `liquiditySource` field is missing", () => {
    // Real-world oneinchfusion payloads omit `liquiditySource` entirely —
    // classification must come from the provider id, not the raw field.
    const result = computeFeeEstimate(
      makeRawQuote({
        provider: "oneinchfusion",
        liquiditySource: undefined,
        networkFees: { currency: "ethereum" },
      }),
      makeEvmContext(),
    );

    expect(result.estimatedNetworkFee).toBeUndefined();
    expect(result.approvalNetworkFee).toBeUndefined();
  });

  it("treats UniswapDutchCustomFields-tagged rows as gasless", () => {
    const result = computeFeeEstimate(
      makeRawQuote({
        provider: "uniswap",
        customFields: { "@type": "UniswapDutchCustomFields" },
        liquiditySource: undefined,
        networkFees: { currency: "ethereum" },
      }),
      makeEvmContext(),
    );

    expect(result.estimatedNetworkFee).toBeUndefined();
    expect(result.approvalNetworkFee).toBeUndefined();
  });

  it("prefers maxFeePerGas over gasPrice when both are set", () => {
    const result = computeFeeEstimate(
      makeRawQuote(),
      makeEvmContext({
        maxFeePerGas: new BigNumber("30000000000"),
        gasPrice: new BigNumber("1"),
      }),
    );

    // 250_000 * 30 gwei = 7.5e15 wei
    expect(result.estimatedNetworkFee?.amount).toBe("7500000000000000");
  });

  it("falls back to gasPrice when maxFeePerGas is zero", () => {
    const result = computeFeeEstimate(
      makeRawQuote(),
      makeEvmContext({
        maxFeePerGas: new BigNumber(0),
        gasPrice: new BigNumber("20000000000"),
      }),
    );

    // 250_000 * 20 gwei = 5e15 wei
    expect(result.estimatedNetworkFee?.amount).toBe("5000000000000000");
  });

  it("uses defaultGasLimit when the quote itself omits gasLimit", () => {
    const result = computeFeeEstimate(
      makeRawQuote({ networkFees: { currency: "ethereum", value: 0.005 } }),
      makeEvmContext({ defaultGasLimit: "500000" }),
    );

    // 500_000 * 25 gwei = 1.25e16 wei
    expect(result.estimatedNetworkFee?.amount).toBe("12500000000000000");
  });
});

describe("computeFeeEstimate — non-EVM fallback (no override)", () => {
  it("emits estimatedNetworkFee = estimatedFeesAtomic when no gas config is available", () => {
    const result = computeFeeEstimate(
      makeRawQuote({ networkFees: { currency: "cosmos" } }),
      makeEvmContext({
        maxFeePerGas: undefined,
        gasPrice: undefined,
        feeCurrencyId: "cosmos",
        mainAccountCurrencyId: "cosmos",
        estimatedFeesAtomic: new BigNumber("7777"),
      }),
    );

    expect(result.estimatedNetworkFee).toEqual({ amount: "7777", currencyId: "cosmos" });
    expect(result.approvalNetworkFee).toBeUndefined();
  });

  it("emits nothing for a gasless quote on a non-EVM chain without gas config", () => {
    const result = computeFeeEstimate(
      makeRawQuote({ provider: "oneinchfusion", networkFees: { currency: "cosmos" } }),
      makeEvmContext({
        maxFeePerGas: undefined,
        gasPrice: undefined,
        feeCurrencyId: "cosmos",
        mainAccountCurrencyId: "cosmos",
      }),
    );

    expect(result.estimatedNetworkFee).toBeUndefined();
    expect(result.approvalNetworkFee).toBeUndefined();
  });
});

describe("computeFeeEstimate — per-chain overrides", () => {
  it("applies the Solana 0.003 SOL override for non-gasless quotes", () => {
    const result = computeFeeEstimate(
      makeRawQuote({ networkFees: { currency: "solana", value: 0.003 } }),
      makeEvmContext({
        maxFeePerGas: undefined,
        gasPrice: undefined,
        feeCurrencyId: "solana",
        feeCurrencyMagnitude: 9,
        mainAccountCurrencyId: "solana",
        estimatedFeesAtomic: new BigNumber("999"),
        balanceAtomic: new BigNumber("100000000"), // 0.1 SOL
      }),
    );

    // 0.003 SOL * 10^9 = 3_000_000 lamports — overrides the bridge-reported 999.
    expect(result.estimatedNetworkFee).toEqual({ amount: "3000000", currencyId: "solana" });
    expect(result.approvalNetworkFee).toBeUndefined();
  });

  it("emits zero fee for a gasless quote on an override chain", () => {
    const result = computeFeeEstimate(
      makeRawQuote({
        provider: "oneinchfusion",
        networkFees: { currency: "solana", value: 0 },
        tags: { isRegistrationRequired: false, isTokenApprovalRequired: false },
      }),
      makeEvmContext({
        feeCurrencyId: "solana",
        feeCurrencyMagnitude: 9,
        mainAccountCurrencyId: "solana",
      }),
    );

    expect(result.estimatedNetworkFee).toBeUndefined();
    expect(result.approvalNetworkFee).toBeUndefined();
  });
});

describe("computeFeeEstimate — notEnoughBalance gating", () => {
  it("returns notEnoughBalance = true when total fees exceed the balance", () => {
    const result = computeFeeEstimate(
      makeRawQuote({ tokenAllowanceData: { isApproved: false } }),
      makeEvmContext({
        balanceAtomic: new BigNumber("1000000000000"), // 1 microether — far less than 0.007 ETH of total fees
      }),
    );

    expect(result.notEnoughBalance).toBe(true);
  });

  it("returns notEnoughBalance = false when the balance covers total fees", () => {
    const result = computeFeeEstimate(
      makeRawQuote({ tokenAllowanceData: { isApproved: false } }),
      makeEvmContext(),
    );

    expect(result.notEnoughBalance).toBe(false);
  });

  it("skips the balance check when networkFees.value is zero AND no approval is required", () => {
    const result = computeFeeEstimate(
      makeRawQuote({
        provider: "oneinchfusion",
        networkFees: { currency: "ethereum", value: 0, gasLimit: "0" },
      }),
      makeEvmContext({ balanceAtomic: new BigNumber(0) }),
    );

    // A zero-fee, already-approved RFQ swap has no on-chain cost — legacy
    // quoteErrorChecker.ts:32-36 short-circuits, so the wallet side must too.
    expect(result.notEnoughBalance).toBe(false);
  });

  it("checks the balance when approval is required even if networkFees.value is zero", () => {
    const result = computeFeeEstimate(
      makeRawQuote({
        provider: "oneinchfusion",
        networkFees: { currency: "ethereum", value: 0, gasLimit: "0" },
        tags: { isRegistrationRequired: false, isTokenApprovalRequired: true },
        tokenAllowanceData: { isApproved: false },
      }),
      makeEvmContext({ balanceAtomic: new BigNumber(0) }),
    );

    expect(result.notEnoughBalance).toBe(true);
  });

  it("checks the balance when tokenAllowanceData.isApproved=false even without isTokenApprovalRequired", () => {
    // Regression: the fee path adds approvalNetworkFee whenever
    // `tokenAllowanceData.isApproved === false`, so the balance gate must
    // use the same signal — otherwise we'd emit a non-zero approval fee
    // and silently skip the `notEnoughBalanceForFees` check when the
    // backend ships one signal without the other.
    const result = computeFeeEstimate(
      makeRawQuote({
        provider: "oneinchfusion",
        networkFees: { currency: "ethereum", value: 0, gasLimit: "0" },
        tags: { isRegistrationRequired: false, isTokenApprovalRequired: false },
        tokenAllowanceData: { isApproved: false },
      }),
      makeEvmContext({ balanceAtomic: new BigNumber(0) }),
    );

    expect(result.approvalNetworkFee).toBeDefined();
    expect(result.notEnoughBalance).toBe(true);
  });
});

describe("computeFeeEstimate — constants", () => {
  it("uses 60_000 as the approval gas limit (matches swap-live-app legacy constant)", () => {
    expect(APPROVAL_GAS_LIMIT).toBe(60_000);
  });
});

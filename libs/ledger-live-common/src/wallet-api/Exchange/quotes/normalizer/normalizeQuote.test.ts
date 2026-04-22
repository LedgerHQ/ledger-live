import type { FormatContext } from "../format/types";
import type { ProviderData } from "../lookupProviderConfig";
import type { RawQuote } from "../service/types";
import { normalizeQuote } from "./normalizeQuote";

/** Minimal `RawQuote` factory; tests override only the fields they exercise. */
function makeRawQuote(overrides: Partial<RawQuote> = {}): RawQuote {
  return {
    provider: "lifi",
    providerType: "DEX",
    type: "float",
    amountFrom: 50,
    amountTo: 49.864507,
    exchangeRate: 0.99729014,
    slippage: 0,
    networkFees: { currency: "ethereum" },
    tags: { isRegistrationRequired: false, isTokenApprovalRequired: false },
    key: "lifi-float-ethereum",
    liquiditySource: "AMM",
    ...overrides,
  };
}

const emptyProviderData: ProviderData = {};

describe("normalizeQuote", () => {
  describe("quoteDetails.slippage — integer-vs-fractional tidy", () => {
    it.each<[number, number]>([
      [0, 0],
      [1, 1],
      [2, 2],
    ])("passes safe-integer slippage %p through untouched", (input, expected) => {
      const quote = normalizeQuote(makeRawQuote({ slippage: input }), emptyProviderData);
      expect(quote.quoteDetails.slippage).toBe(expected);
    });

    it("rounds the lifi 0.7775697944164467 case to 0.8", () => {
      const quote = normalizeQuote(
        makeRawQuote({ slippage: 0.7775697944164467 }),
        emptyProviderData,
      );
      expect(quote.quoteDetails.slippage).toBe(0.8);
    });

    it.each<[number, number]>([
      [0.05, 0.1],
      [0.04, 0],
      [0.123456, 0.1],
      [0.99, 1],
    ])("rounds fractional slippage %p to %p (1 decimal place)", (input, expected) => {
      const quote = normalizeQuote(makeRawQuote({ slippage: input }), emptyProviderData);
      expect(quote.quoteDetails.slippage).toBe(expected);
    });
  });

  describe("quoteDetails.liquiditySource — RFQ / AMM classification", () => {
    it("marks oneinchfusion rows as RFQ regardless of @type", () => {
      const quote = normalizeQuote(
        makeRawQuote({ provider: "oneinchfusion", customFields: {} }),
        emptyProviderData,
      );
      expect(quote.quoteDetails.liquiditySource).toBe("RFQ");
    });

    it("marks UniswapDutchCustomFields-tagged rows as RFQ", () => {
      const quote = normalizeQuote(
        makeRawQuote({
          provider: "uniswap",
          customFields: { "@type": "UniswapDutchCustomFields" },
        }),
        emptyProviderData,
      );
      expect(quote.quoteDetails.liquiditySource).toBe("RFQ");
    });

    it("marks oneinch (classic, non-fusion) rows as AMM", () => {
      const quote = normalizeQuote(
        makeRawQuote({ provider: "oneinch", customFields: {} }),
        emptyProviderData,
      );
      expect(quote.quoteDetails.liquiditySource).toBe("AMM");
    });

    it("falls back to AMM when no @type tag is present and the provider is neither oneinchfusion nor a UniswapDutch row", () => {
      const quote = normalizeQuote(
        makeRawQuote({ provider: "lifi", customFields: undefined }),
        emptyProviderData,
      );
      expect(quote.quoteDetails.liquiditySource).toBe("AMM");
    });

    it("ignores the raw `liquiditySource` API field (classification is derived from provider + @type)", () => {
      const quote = normalizeQuote(
        makeRawQuote({
          provider: "lifi",
          customFields: undefined,
          liquiditySource: "RFQ",
        }),
        emptyProviderData,
      );
      expect(quote.quoteDetails.liquiditySource).toBe("AMM");
    });
  });

  describe("quoteDetails.gasLess — derived from liquiditySource classification", () => {
    it("is true for oneinchfusion even when raw liquiditySource is missing", () => {
      const quote = normalizeQuote(
        makeRawQuote({ provider: "oneinchfusion", liquiditySource: undefined }),
        emptyProviderData,
      );
      expect(quote.quoteDetails.liquiditySource).toBe("RFQ");
      expect(quote.quoteDetails.gasLess).toBe(true);
    });

    it("is true for UniswapDutchCustomFields-tagged rows", () => {
      const quote = normalizeQuote(
        makeRawQuote({
          provider: "uniswap",
          customFields: { "@type": "UniswapDutchCustomFields" },
          liquiditySource: undefined,
        }),
        emptyProviderData,
      );
      expect(quote.quoteDetails.liquiditySource).toBe("RFQ");
      expect(quote.quoteDetails.gasLess).toBe(true);
    });

    it("is false for AMM rows even if the raw `liquiditySource` says RFQ", () => {
      const quote = normalizeQuote(
        makeRawQuote({ provider: "lifi", liquiditySource: "RFQ" }),
        emptyProviderData,
      );
      expect(quote.quoteDetails.liquiditySource).toBe("AMM");
      expect(quote.quoteDetails.gasLess).toBe(false);
    });
  });

  describe("quoteDetails.payoutNetworkFees — optional passthrough with currency → currencyId remap", () => {
    it("leaves the field unset when the raw quote does not advertise a payout fee", () => {
      const quote = normalizeQuote(
        makeRawQuote({ payoutNetworkFees: undefined }),
        emptyProviderData,
      );
      expect(quote.quoteDetails.payoutNetworkFees).toBeUndefined();
    });

    it("maps a populated payout fee to the wallet schema (currency → currencyId)", () => {
      const quote = normalizeQuote(
        makeRawQuote({
          payoutNetworkFees: { value: 0.002, currency: "bitcoin" },
        }),
        emptyProviderData,
      );
      expect(quote.quoteDetails.payoutNetworkFees).toEqual({
        value: 0.002,
        currencyId: "bitcoin",
      });
    });

    it("preserves a legitimate `value: 0` row (distinct from the absent case)", () => {
      const quote = normalizeQuote(
        makeRawQuote({
          payoutNetworkFees: { value: 0, currency: "bitcoin" },
        }),
        emptyProviderData,
      );
      expect(quote.quoteDetails.payoutNetworkFees).toEqual({
        value: 0,
        currencyId: "bitcoin",
      });
    });
  });

  describe("quoteDetails.tokenAllowance — field rename with shape passthrough", () => {
    it("leaves the field unset when the raw quote has no tokenAllowanceData", () => {
      const quote = normalizeQuote(
        makeRawQuote({ tokenAllowanceData: undefined }),
        emptyProviderData,
      );
      expect(quote.quoteDetails.tokenAllowance).toBeUndefined();
    });

    it("passes an already-approved row through as `{ isApproved: true }`", () => {
      const quote = normalizeQuote(
        makeRawQuote({ tokenAllowanceData: { isApproved: true } }),
        emptyProviderData,
      );
      expect(quote.quoteDetails.tokenAllowance).toEqual({ isApproved: true });
    });

    it("preserves the full needs-approval payload including approvalTransaction", () => {
      const approvalTransaction = {
        to: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        from: "0xd17836dd9dE8b1B37Df44261BA39a1f4632eb788",
        value: "0",
        calldata: "0x095ea7b3",
        gasLimit: 56373,
        gasPrice: 20_000_000_000,
      };

      const quote = normalizeQuote(
        makeRawQuote({
          tokenAllowanceData: {
            isApproved: false,
            approvedAmount: "0",
            approvalTransaction,
          },
        }),
        emptyProviderData,
      );

      expect(quote.quoteDetails.tokenAllowance).toEqual({
        isApproved: false,
        approvedAmount: "0",
        approvalTransaction,
      });
    });
  });

  describe("quoteDetails.tags — passthrough of the raw booleans", () => {
    it("mirrors both flags when neither KYC nor token approval is required", () => {
      const quote = normalizeQuote(
        makeRawQuote({
          tags: { isRegistrationRequired: false, isTokenApprovalRequired: false },
        }),
        emptyProviderData,
      );
      expect(quote.quoteDetails.tags).toEqual({
        isRegistrationRequired: false,
        isTokenApprovalRequired: false,
      });
    });

    it("mirrors both flags when both are required (CEX + token approval)", () => {
      const quote = normalizeQuote(
        makeRawQuote({
          tags: { isRegistrationRequired: true, isTokenApprovalRequired: true },
        }),
        emptyProviderData,
      );
      expect(quote.quoteDetails.tags).toEqual({
        isRegistrationRequired: true,
        isTokenApprovalRequired: true,
      });
    });

    it("mirrors a mixed row (KYC required, approval not required)", () => {
      const quote = normalizeQuote(
        makeRawQuote({
          tags: { isRegistrationRequired: true, isTokenApprovalRequired: false },
        }),
        emptyProviderData,
      );
      expect(quote.quoteDetails.tags).toEqual({
        isRegistrationRequired: true,
        isTokenApprovalRequired: false,
      });
    });
  });

  describe("quoteDetails.permitData — hoists the customFields permit bag", () => {
    const uniswapXTypedData = {
      domain: {
        name: "Permit2",
        chainId: 1,
        verifyingContract: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
      },
      types: {
        PermitSingle: [{ name: "details", type: "PermitDetails" }],
        PermitDetails: [{ name: "token", type: "address" }],
        EIP712Domain: [] as { name: string; type: string }[],
      },
      values: {
        details: {
          token: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          amount: "261632407",
          expiration: "1740312470",
          nonce: "0",
        },
        spender: "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD",
        sigDeadline: "1737722270",
      },
    };

    const oneinchFusionTypedData = {
      domain: {
        name: "Permit2",
        chainId: 1,
        verifyingContract: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
      },
      message: {
        details: {
          token: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          amount: "100",
          expiration: "1740000000",
          nonce: "1",
        },
        spender: "0x1111111111111111111111111111111111111111",
        sigDeadline: "1737000000",
      },
      primaryType: "PermitSingle" as const,
    };

    it("leaves the field unset when the raw quote carries no customFields", () => {
      const quote = normalizeQuote(makeRawQuote({ customFields: undefined }), emptyProviderData);
      expect(quote.quoteDetails.permitData).toBeUndefined();
    });

    it("leaves the field unset when customFields carries only permit-unrelated keys", () => {
      const quote = normalizeQuote(
        makeRawQuote({ customFields: { quoteId: "abc", quote: { x: 1 } } }),
        emptyProviderData,
      );
      expect(quote.quoteDetails.permitData).toBeUndefined();
    });

    it("hoists the UniswapX permit payload under `typedData` and carries providerTag from `@type`", () => {
      const quote = normalizeQuote(
        makeRawQuote({
          provider: "uniswap",
          customFields: {
            permitData: uniswapXTypedData,
            "@type": "UniswapDutchCustomFields",
          },
        }),
        emptyProviderData,
      );
      expect(quote.quoteDetails.permitData).toEqual({
        typedData: uniswapXTypedData,
        providerTag: "UniswapDutchCustomFields",
      });
    });

    it("hoists the 1inch-fusion payload and surfaces orderHash as a sibling of typedData", () => {
      const quote = normalizeQuote(
        makeRawQuote({
          provider: "oneinchfusion",
          customFields: {
            quoteResponse: {
              typedData: oneinchFusionTypedData,
              orderHash: "0xdeadbeef",
            },
          },
        }),
        emptyProviderData,
      );
      expect(quote.quoteDetails.permitData).toEqual({
        typedData: oneinchFusionTypedData,
        orderHash: "0xdeadbeef",
      });
    });

    it("prefers customFields.permitData over quoteResponse.typedData when both are present", () => {
      // Mirrors the `??` precedence in rfqOrderManagement.signOrderMessage so
      // we don't silently invert the typed-data source for UniswapX-and-fusion
      // pathological rows.
      const quote = normalizeQuote(
        makeRawQuote({
          provider: "uniswap",
          customFields: {
            permitData: uniswapXTypedData,
            quoteResponse: {
              typedData: oneinchFusionTypedData,
              orderHash: "0xdeadbeef",
            },
          },
        }),
        emptyProviderData,
      );
      expect(quote.quoteDetails.permitData?.typedData).toEqual(uniswapXTypedData);
      expect(quote.quoteDetails.permitData?.orderHash).toBe("0xdeadbeef");
    });

    it("passes a Velora priceRoute through opaquely without populating other fields", () => {
      const priceRoute = { opaque: true, steps: [1, 2, 3] };
      const quote = normalizeQuote(
        makeRawQuote({
          provider: "velora",
          customFields: { priceRoute },
        }),
        emptyProviderData,
      );
      expect(quote.quoteDetails.permitData).toEqual({ priceRoute });
    });
  });

  describe("warning.unrealisticQuote — fiat gain detection", () => {
    // Canonical "doubled in fiat" fixture: 1 unit from × 1.0 / 1 unit to × 2.0.
    // Keeps spot values symmetric and gainPercent expressible as an exact
    // integer (100%) so the tests assert on precise numeric output.
    const doubledInFiat = {
      sendCurrencyId: "ethereum",
      receiveCurrencyId: "bitcoin",
      spotPrices: { ethereum: 1, bitcoin: 2 },
    };

    it("returns no warning when `spotPrices` is empty (legacy missing-prices branch)", () => {
      const quote = normalizeQuote(
        makeRawQuote({ amountFrom: 10, amountTo: 10 }),
        emptyProviderData,
        {
          sendCurrencyId: "ethereum",
          receiveCurrencyId: "bitcoin",
          spotPrices: {},
        },
      );
      expect(quote.warning).toBeNull();
    });

    it("returns no warning when only the `from` spot price is available", () => {
      const quote = normalizeQuote(
        makeRawQuote({ amountFrom: 10, amountTo: 100 }),
        emptyProviderData,
        {
          sendCurrencyId: "ethereum",
          receiveCurrencyId: "bitcoin",
          spotPrices: { ethereum: 1 },
        },
      );
      expect(quote.warning).toBeNull();
    });

    it("returns no warning when `amountFrom` is zero (division guard)", () => {
      const quote = normalizeQuote(
        makeRawQuote({ amountFrom: 0, amountTo: 100 }),
        emptyProviderData,
        doubledInFiat,
      );
      expect(quote.warning).toBeNull();
    });

    it("returns no warning when `amountFrom` is missing", () => {
      const quote = normalizeQuote(
        makeRawQuote({ amountFrom: undefined, amountTo: 100 }),
        emptyProviderData,
        doubledInFiat,
      );
      expect(quote.warning).toBeNull();
    });

    it("returns no warning when the gain is non-positive (output fiat ≤ input fiat)", () => {
      // amountFromFiat = 10 * 1 = 10, amountToFiat = 5 * 2 = 10 → gain = 0%
      const quote = normalizeQuote(
        makeRawQuote({ amountFrom: 10, amountTo: 5 }),
        emptyProviderData,
        doubledInFiat,
      );
      expect(quote.warning).toBeNull();
    });

    it("emits `unrealisticQuote` with a positive `gainPercent` when output fiat exceeds input fiat", () => {
      // amountFromFiat = 1 * 1 = 1, amountToFiat = 1 * 2 = 2 → gain = 100%
      const quote = normalizeQuote(
        makeRawQuote({ amountFrom: 1, amountTo: 1 }),
        emptyProviderData,
        doubledInFiat,
      );
      expect(quote.warning).toEqual({ code: "unrealisticQuote", gainPercent: 100 });
    });

    it("preserves fractional `gainPercent` values", () => {
      // amountFromFiat = 100, amountToFiat = 101.5 → gain = 1.5%
      const quote = normalizeQuote(
        makeRawQuote({ amountFrom: 100, amountTo: 101.5 }),
        emptyProviderData,
        {
          sendCurrencyId: "ethereum",
          receiveCurrencyId: "bitcoin",
          spotPrices: { ethereum: 1, bitcoin: 1 },
        },
      );
      expect(quote.warning).toEqual({ code: "unrealisticQuote", gainPercent: 1.5 });
    });
  });

  describe("quoteDetails.estimatedNetworkFee / approvalNetworkFee — fee estimate plumbing", () => {
    const emptyUnrealisticInput = {
      sendCurrencyId: "",
      receiveCurrencyId: "",
      spotPrices: {},
    };

    it("populates both fields and leaves error = null when approval is needed and balance is sufficient", () => {
      const quote = normalizeQuote(
        makeRawQuote({ tokenAllowanceData: { isApproved: false } }),
        emptyProviderData,
        emptyUnrealisticInput,
        {
          estimatedNetworkFee: { amount: "6250000000000000", currencyId: "ethereum" },
          approvalNetworkFee: { amount: "1500000000000000", currencyId: "ethereum" },
          notEnoughBalance: false,
        },
      );
      expect(quote.quoteDetails.estimatedNetworkFee).toEqual({
        amount: "6250000000000000",
        currencyId: "ethereum",
      });
      expect(quote.quoteDetails.approvalNetworkFee).toEqual({
        amount: "1500000000000000",
        currencyId: "ethereum",
      });
      expect(quote.error).toBeNull();
    });

    it("emits `notEnoughBalanceForFees` when the fee estimate reports insufficient balance", () => {
      const quote = normalizeQuote(makeRawQuote(), emptyProviderData, emptyUnrealisticInput, {
        estimatedNetworkFee: { amount: "6250000000000000", currencyId: "ethereum" },
        approvalNetworkFee: undefined,
        notEnoughBalance: true,
      });
      expect(quote.error).toBe("notEnoughBalanceForFees");
    });

    it("omits both fields and leaves error = null when the fee estimate is undefined", () => {
      const quote = normalizeQuote(makeRawQuote(), emptyProviderData, emptyUnrealisticInput);
      expect(quote.quoteDetails.estimatedNetworkFee).toBeUndefined();
      expect(quote.quoteDetails.approvalNetworkFee).toBeUndefined();
      expect(quote.error).toBeNull();
    });

    it("omits fields individually when the fee estimate marks them undefined", () => {
      const quote = normalizeQuote(
        makeRawQuote({ liquiditySource: "RFQ", tokenAllowanceData: { isApproved: false } }),
        emptyProviderData,
        emptyUnrealisticInput,
        {
          estimatedNetworkFee: undefined,
          approvalNetworkFee: { amount: "1500000000000000", currencyId: "ethereum" },
          notEnoughBalance: false,
        },
      );
      expect(quote.quoteDetails.estimatedNetworkFee).toBeUndefined();
      expect(quote.quoteDetails.approvalNetworkFee).toEqual({
        amount: "1500000000000000",
        currencyId: "ethereum",
      });
    });
  });

  describe("quote.formatted — wallet-side display strings", () => {
    const NBSP = "\u00A0";

    const formatContext: FormatContext = {
      locale: "en",
      fiat: { ticker: "USD", symbol: "$", magnitude: 2 },
      spotPrices: {
        ethereum: 3000,
        "ethereum/erc20/usd__coin": 1,
      },
      sendCurrency: { id: "ethereum", decimals: 18, ticker: "ETH" },
      receiveCurrency: {
        id: "ethereum/erc20/usd__coin",
        decimals: 6,
        ticker: "USDC",
      },
      networkFeesCurrency: { id: "ethereum", decimals: 18, ticker: "ETH" },
    };

    it("leaves `formatted` undefined when no formatContext is supplied (legacy callers)", () => {
      const quote = normalizeQuote(
        makeRawQuote({ amountFrom: 1.5, amountTo: 4500, exchangeRate: 3000 }),
        emptyProviderData,
      );
      expect(quote.formatted).toBeUndefined();
    });

    it("attaches a complete FormattedQuoteValues object when formatContext is supplied", () => {
      const quote = normalizeQuote(
        makeRawQuote({
          amountFrom: 1.5,
          amountTo: 4500,
          exchangeRate: 3000,
          slippage: 0,
          type: "float",
        }),
        emptyProviderData,
        {
          sendCurrencyId: "ethereum",
          receiveCurrencyId: "ethereum/erc20/usd__coin",
          spotPrices: formatContext.spotPrices,
        },
        {
          // 0.0005 ETH at 18 decimals = 5e14 wei
          estimatedNetworkFee: { amount: "500000000000000", currencyId: "ethereum" },
          approvalNetworkFee: undefined,
          notEnoughBalance: false,
        },
        formatContext,
      );

      expect(quote.formatted).toEqual({
        sendAmount: {
          numberValue: "1.5",
          withPrefix: `ETH${NBSP}1.5`,
          withSuffix: `1.5${NBSP}ETH`,
        },
        sendAmountCountervalue: {
          numberValue: "4,500",
          withPrefix: "$4,500",
          withSuffix: `4,500${NBSP}$`,
        },
        receiveAmount: {
          numberValue: "4,500",
          withPrefix: `USDC${NBSP}4,500`,
          withSuffix: `4,500${NBSP}USDC`,
        },
        receiveAmountCountervalue: {
          numberValue: "4,500",
          withPrefix: "$4,500",
          withSuffix: `4,500${NBSP}$`,
        },
        networkFee: {
          numberValue: "0.0005",
          withPrefix: `ETH${NBSP}0.0005`,
          withSuffix: `0.0005${NBSP}ETH`,
        },
        networkFeeCountervalue: {
          numberValue: "1.5",
          withPrefix: "$1.5",
          withSuffix: `1.5${NBSP}$`,
        },
        rate: {
          numberValue: `1 ETH = 3,000${NBSP}USDC`,
          withPrefix: `1 ETH = 3,000${NBSP}USDC`,
          withSuffix: `1 ETH = 3,000${NBSP}USDC`,
        },
        slippage: {
          numberValue: "0",
          withPrefix: "0",
          withSuffix: "0%",
        },
      });
    });

    it("renders `0 <feeTicker>` for the network fee when the fee estimate is undefined (gasless / no bridge)", () => {
      const quote = normalizeQuote(
        makeRawQuote({ amountFrom: 1, amountTo: 3000, exchangeRate: 3000, type: "fixed" }),
        emptyProviderData,
        undefined,
        undefined,
        formatContext,
      );
      expect(quote.formatted?.networkFee.withSuffix).toBe(`0${NBSP}ETH`);
      expect(quote.formatted?.networkFee.numberValue).toBe("0");
    });

    it("excludes the approval fee from formatted.networkFee (only estimatedNetworkFee counts)", () => {
      // estimated = 0.0003 ETH, approval = 0.0002 ETH; swap-parity: only
      // the base swap-gas amount flows into the `networkFee` display string.
      const quote = normalizeQuote(
        makeRawQuote(),
        emptyProviderData,
        undefined,
        {
          estimatedNetworkFee: { amount: "300000000000000", currencyId: "ethereum" },
          approvalNetworkFee: { amount: "200000000000000", currencyId: "ethereum" },
          notEnoughBalance: false,
        },
        formatContext,
      );
      expect(quote.formatted?.networkFee.withSuffix).toBe(`0.0003${NBSP}ETH`);
      expect(quote.formatted?.networkFee.numberValue).toBe("0.0003");
    });
  });

  describe("quote.id — resolved from raw.quoteId then customFields.quoteId", () => {
    it("uses raw.quoteId when present (top-level wins over customFields)", () => {
      const quote = normalizeQuote(
        makeRawQuote({
          quoteId: "top-level-id",
          customFields: { quoteId: "custom-id" },
        }),
        emptyProviderData,
      );
      expect(quote.id).toBe("top-level-id");
    });

    it("falls back to customFields.quoteId when raw.quoteId is missing", () => {
      const quote = normalizeQuote(
        makeRawQuote({
          quoteId: undefined,
          customFields: { quoteId: "fallback-quote-id-42" },
        }),
        emptyProviderData,
      );
      expect(quote.id).toBe("fallback-quote-id-42");
    });

    it("returns undefined when neither field is set", () => {
      const quote = normalizeQuote(
        makeRawQuote({ quoteId: undefined, customFields: undefined }),
        emptyProviderData,
      );
      expect(quote.id).toBeUndefined();
    });

    it("ignores empty-string customFields.quoteId (not a usable identifier)", () => {
      const quote = normalizeQuote(
        makeRawQuote({
          quoteId: undefined,
          customFields: { quoteId: "" },
        }),
        emptyProviderData,
      );
      expect(quote.id).toBeUndefined();
    });

    it("ignores non-string customFields.quoteId values defensively", () => {
      const quote = normalizeQuote(
        makeRawQuote({
          quoteId: undefined,
          // Aggregator could in theory send a number; the wallet contract
          // only accepts strings. Anything else is treated as missing.
          customFields: { quoteId: 42 as unknown as string },
        }),
        emptyProviderData,
      );
      expect(quote.id).toBeUndefined();
    });
  });

  describe("quote.key — fallback to `${normalizedProvider}-${type}` when raw.key is missing", () => {
    it("preserves raw.key verbatim when present", () => {
      const quote = normalizeQuote(
        makeRawQuote({ key: "custom-aggregator-key-xyz" }),
        emptyProviderData,
      );
      expect(quote.key).toBe("custom-aggregator-key-xyz");
    });

    it("derives `${provider}-${type}` when raw.key is missing", () => {
      const quote = normalizeQuote(
        makeRawQuote({ provider: "lifi", type: "float", key: undefined }),
        emptyProviderData,
      );
      expect(quote.key).toBe("lifi-float");
    });

    it("derives the key from the NORMALIZED provider id (changelly_v2 → changelly) when raw.key is missing", () => {
      const quote = normalizeQuote(
        makeRawQuote({ provider: "changelly_v2", type: "fixed", key: undefined }),
        emptyProviderData,
      );
      expect(quote.key).toBe("changelly-fixed");
    });

    it("preserves raw.key verbatim even when the provider would be renamed (raw.key wins)", () => {
      const quote = normalizeQuote(
        makeRawQuote({
          provider: "changelly_v2",
          type: "fixed",
          key: "changelly_v2-fixed-bitcoin",
        }),
        emptyProviderData,
      );
      // `quote.provider` is renamed but `quote.key` stays as the raw value.
      // Consumers of `key` are expected to treat it opaquely.
      expect(quote.provider).toBe("changelly");
      expect(quote.key).toBe("changelly_v2-fixed-bitcoin");
    });
  });
});

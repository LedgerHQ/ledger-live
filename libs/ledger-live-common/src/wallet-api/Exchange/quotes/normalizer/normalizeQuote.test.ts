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
});

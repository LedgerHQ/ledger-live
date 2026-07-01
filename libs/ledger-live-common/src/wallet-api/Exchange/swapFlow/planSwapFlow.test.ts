import type { Quote, QuotePermit2Message } from "../quotes/types";
import { planSwapFlow } from "./planSwapFlow";
import type { PlanSwapFlowInput } from "./types";

const APPROVAL_TX = {
  calldata: "0xabc",
  from: "0xfrom",
  gasLimit: 100_000,
  gasPrice: 1_000_000_000,
  to: "0xspender",
  value: "0",
};

const PERMIT_TYPED_DATA: QuotePermit2Message = {
  values: {
    details: {
      token: "0xtoken",
      amount: "1",
      expiration: "0",
      nonce: "0",
    },
    spender: "0xspender",
    sigDeadline: "0",
  },
  domain: {
    name: "Permit2",
    chainId: 1,
    verifyingContract: "0xv",
  },
  types: {
    EIP712Domain: [],
    PermitSingle: [],
    PermitDetails: [],
  },
  primaryType: "PermitSingle",
};

function makeQuote(overrides: {
  provider?: string;
  providerType?: "DEX" | "CEX";
  isUniswapX?: boolean;
  isTokenApprovalRequired?: boolean;
  isApproved?: boolean;
  hasApprovalBlob?: boolean;
  permitTypedData?: QuotePermit2Message | null;
  permitOrderHash?: string;
  customFields?: Record<string, unknown>;
  approvedAmount?: string;
  sendAmount?: number;
} = {}): Quote {
  const {
    provider = "uniswap",
    providerType = "DEX",
    isUniswapX = false,
    isTokenApprovalRequired = false,
    isApproved = false,
    hasApprovalBlob = true,
    permitTypedData = null,
    permitOrderHash,
    customFields,
    approvedAmount,
    sendAmount = 1,
  } = overrides;

  const permitData =
    permitTypedData || permitOrderHash
      ? {
          ...(permitTypedData ? { typedData: permitTypedData } : {}),
          ...(permitOrderHash ? { orderHash: permitOrderHash } : {}),
        }
      : undefined;

  return {
    key: `${provider}-test`,
    provider,
    providerDetails: {
      name: provider,
      type: providerType,
      isUniswapX,
      requiresKYC: false,
      continuesInProviderLiveApp: false,
    },
    quoteDetails: {
      type: "float",
      sendAmount,
      receiveAmount: 1,
      gasLess: false,
      networkFees: { currencyId: "ethereum" },
      slippage: 0.5,
      exchangeRate: 1,
      tags: {
        isRegistrationRequired: false,
        isTokenApprovalRequired,
      },
      tokenAllowance: isTokenApprovalRequired
        ? {
            isApproved,
            approvedAmount,
            approvalTransaction: hasApprovalBlob ? APPROVAL_TX : undefined,
          }
        : undefined,
      permitData,
    },
    warnings: [],
    errors: [],
    customFields,
  };
}

const BASE_INPUT: Omit<PlanSwapFlowInput, "quote"> = {
  fromAccountId: "wallet:0",
  toAccountId: "wallet:1",
  fromAccountAddress: "0xfrom",
  fromCurrencyId: "ethereum",
  toCurrencyId: "ethereum/erc20/usdc",
  defaultGasLimit: "200000",
  gasLimitMultiplier: 1.2,
};

function plan(quote: Quote) {
  return planSwapFlow({ quote, ...BASE_INPUT });
}

describe("planSwapFlow", () => {
  describe("classic AMM (no permit, non-RFQ)", () => {
    it("returns direct-swap when DEX and no approval needed", () => {
      const result = plan(makeQuote({ provider: "uniswap" }));
      expect(result.kind).toBe("direct-swap");
    });

    it("returns approval-then-swap when DEX and approval is needed", () => {
      const result = plan(
        makeQuote({
          provider: "uniswap",
          isTokenApprovalRequired: true,
          isApproved: false,
          hasApprovalBlob: true,
        }),
      );
      expect(result.kind).toBe("approval-then-swap");
      if (result.kind === "approval-then-swap") {
        expect(result.approvalTransaction).toEqual(APPROVAL_TX);
        expect(result.provider).toBe("uniswap");
      }
    });

    it("skips with `dex-approval-blob-missing` when DEX requires approval but ships no blob", () => {
      const result = plan(
        makeQuote({
          provider: "uniswap",
          isTokenApprovalRequired: true,
          isApproved: false,
          hasApprovalBlob: false,
        }),
      );
      expect(result).toEqual({
        kind: "skip",
        reason: "dex-approval-blob-missing",
      });
    });
  });

  describe("Permit2 + classic AMM", () => {
    it("returns permit-then-swap when DEX, no approval, and permitData is present", () => {
      const result = plan(
        makeQuote({
          provider: "uniswap",
          permitTypedData: PERMIT_TYPED_DATA,
        }),
      );
      expect(result.kind).toBe("permit-then-swap");
      if (result.kind === "permit-then-swap") {
        expect(result.permitTypedData.primaryType).toBe("PermitSingle");
        expect(result.permitTypedData.types.EIP712Domain).toEqual([
          { name: "name", type: "string" },
          { name: "chainId", type: "uint256" },
          { name: "verifyingContract", type: "address" },
        ]);
      }
    });

    it("returns approval-then-permit-then-swap when DEX, approval required, and permitData is present", () => {
      const result = plan(
        makeQuote({
          provider: "uniswap",
          isTokenApprovalRequired: true,
          isApproved: false,
          hasApprovalBlob: true,
          permitTypedData: PERMIT_TYPED_DATA,
        }),
      );
      expect(result.kind).toBe("approval-then-permit-then-swap");
      if (result.kind === "approval-then-permit-then-swap") {
        expect(result.approvalTransaction).toEqual(APPROVAL_TX);
        expect(result.permitTypedData.primaryType).toBe("PermitSingle");
      }
    });

    it("throws when permitData is incomplete (no domain)", () => {
      const incomplete: QuotePermit2Message = {
        values: PERMIT_TYPED_DATA.values,
        types: PERMIT_TYPED_DATA.types,
      };
      expect(() =>
        plan(
          makeQuote({
            provider: "uniswap",
            permitTypedData: incomplete,
          }),
        ),
      ).toThrow(/domain/);
    });
  });

  describe("RFQ flows", () => {
    const RFQ_TYPED_DATA: QuotePermit2Message = {
      values: PERMIT_TYPED_DATA.values,
      domain: PERMIT_TYPED_DATA.domain,
      types: PERMIT_TYPED_DATA.types,
    };

    it("returns rfq-order for a UniswapX quote whose approval is already done", () => {
      const result = plan(
        makeQuote({
          provider: "uniswap",
          isUniswapX: true,
          isTokenApprovalRequired: true,
          isApproved: true,
          permitTypedData: RFQ_TYPED_DATA,
        }),
      );
      expect(result.kind).toBe("rfq-order");
      if (result.kind === "rfq-order") {
        expect(result.rfqProvider).toBe("uniswapx");
        expect(result.provider).toBe("uniswap");
        expect(result.orderTypedData.primaryType).toBe(
          "PermitWitnessTransferFrom",
        );
      }
    });

    it("returns rfq-order for a oneinchfusion quote that ships a `quoteResponse` customField", () => {
      const oneInchTypedData: QuotePermit2Message = {
        ...RFQ_TYPED_DATA,
        message: RFQ_TYPED_DATA.values,
        values: undefined,
        primaryType: "Order",
      };
      const result = plan(
        makeQuote({
          provider: "oneinchfusion",
          providerType: "DEX",
          permitTypedData: oneInchTypedData,
          permitOrderHash: "0xdeadbeef",
          customFields: {
            quoteResponse: { orderHash: "0xdeadbeef" },
          },
        }),
      );
      expect(result.kind).toBe("rfq-order");
      if (result.kind === "rfq-order") {
        expect(result.rfqProvider).toBe("oneinchfusion");
        expect(result.provider).toBe("oneinchfusion");
        expect(result.precomputedOrderId).toBe("0xdeadbeef");
        expect(result.orderTypedData.primaryType).toBe("Order");
      }
    });

    it("returns approval-then-rfq-order for a UniswapX quote that still requires an approval", () => {
      const result = plan(
        makeQuote({
          provider: "uniswap",
          isUniswapX: true,
          isTokenApprovalRequired: true,
          isApproved: false,
          hasApprovalBlob: true,
          permitTypedData: RFQ_TYPED_DATA,
        }),
      );
      expect(result.kind).toBe("approval-then-rfq-order");
      if (result.kind === "approval-then-rfq-order") {
        expect(result.approvalTransaction).toEqual(APPROVAL_TX);
        expect(result.rfqProvider).toBe("uniswapx");
      }
    });

    it("populates the UniswapX submit body with the routing override", () => {
      const result = plan(
        makeQuote({
          provider: "uniswap",
          isUniswapX: true,
          isTokenApprovalRequired: true,
          isApproved: true,
          permitTypedData: RFQ_TYPED_DATA,
          customFields: { "@type": "UniswapDutchCustomFields" },
        }),
      );
      expect(result.kind).toBe("rfq-order");
      if (result.kind === "rfq-order") {
        expect(result.submitBody).toEqual({
          "@type": "UniswapDutchCustomFields",
          routing: "DUTCH_V2",
        });
      }
    });

    it("forwards the oneinchfusion customFields verbatim in the submit body", () => {
      const result = plan(
        makeQuote({
          provider: "oneinchfusion",
          providerType: "DEX",
          permitTypedData: {
            ...RFQ_TYPED_DATA,
            message: RFQ_TYPED_DATA.values,
            values: undefined,
            primaryType: "Order",
          },
          permitOrderHash: "0xdead",
          customFields: { quoteResponse: { orderHash: "0xdead" } },
        }),
      );
      expect(result.kind).toBe("rfq-order");
      if (result.kind === "rfq-order") {
        expect(result.submitBody).toEqual({
          quoteResponse: { orderHash: "0xdead" },
        });
      }
    });

    it("skips with `rfq-typed-data-missing` when an RFQ quote omits typed data", () => {
      const result = plan(
        makeQuote({
          provider: "uniswap",
          isUniswapX: true,
          isTokenApprovalRequired: true,
          isApproved: true,
        }),
      );
      expect(result).toEqual({
        kind: "skip",
        reason: "rfq-typed-data-missing",
      });
    });

    it("skips with `rfq-typed-data-missing` for oneinchfusion quotes that omit typed data", () => {
      const result = plan(
        makeQuote({
          provider: "oneinchfusion",
          providerType: "DEX",
        }),
      );
      expect(result).toEqual({
        kind: "skip",
        reason: "rfq-typed-data-missing",
      });
    });

    it("classifies oneinchfusion as RFQ even without a `quoteResponse` customField", () => {
      const oneInchTypedData: QuotePermit2Message = {
        ...RFQ_TYPED_DATA,
        message: RFQ_TYPED_DATA.values,
        values: undefined,
        primaryType: "Order",
      };
      const result = plan(
        makeQuote({
          provider: "oneinchfusion",
          providerType: "DEX",
          permitTypedData: oneInchTypedData,
          permitOrderHash: "0xfeed",
        }),
      );
      expect(result.kind).toBe("rfq-order");
      if (result.kind === "rfq-order") {
        expect(result.rfqProvider).toBe("oneinchfusion");
        expect(result.precomputedOrderId).toBe("0xfeed");
      }
    });

    it("uses the network-fee currency id as the status-polling network", () => {
      const result = plan(
        makeQuote({
          provider: "uniswap",
          isUniswapX: true,
          isTokenApprovalRequired: true,
          isApproved: true,
          permitTypedData: RFQ_TYPED_DATA,
        }),
      );
      expect(result.kind).toBe("rfq-order");
      if (result.kind === "rfq-order") {
        expect(result.network).toBe("ethereum");
      }
    });
  });

  describe("non-DEX providers", () => {
    it("returns approval-only when CEX provider needs an ERC-20 approval", () => {
      const result = plan(
        makeQuote({
          provider: "changelly",
          providerType: "CEX",
          isTokenApprovalRequired: true,
          isApproved: false,
          hasApprovalBlob: true,
        }),
      );
      expect(result.kind).toBe("approval-only");
    });

    it("skips with `no-approval-non-dex` when CEX and no approval is needed", () => {
      const result = plan(
        makeQuote({
          provider: "changelly",
          providerType: "CEX",
        }),
      );
      expect(result).toEqual({
        kind: "skip",
        reason: "no-approval-non-dex",
      });
    });

    it("skips with `already-approved-non-dex` when CEX and the allowance is already approved", () => {
      const result = plan(
        makeQuote({
          provider: "changelly",
          providerType: "CEX",
          isTokenApprovalRequired: true,
          isApproved: true,
        }),
      );
      expect(result).toEqual({
        kind: "skip",
        reason: "already-approved-non-dex",
      });
    });
  });

  describe("USDT-revoke edge case", () => {
    // 350 USDT (display units); allowance below atomises to less than the
    // 350_000_000 atomic units of the swap amount.
    const usdtQuote = (provider: string) =>
      makeQuote({
        provider,
        providerType: "DEX",
        isTokenApprovalRequired: true,
        isApproved: false,
        approvedAmount: "1",
        sendAmount: 350,
      });

    const USDT_INPUT = {
      fromCurrencyTicker: "USDT",
      fromCurrencyParentId: "ethereum",
    };

    it.each(["thorswap", "lifi", "oneinchfusion", "oneinch", "velora", "okx"])(
      "skips with `usdt-revoke-needed` for %s when allowance < swap amount",
      provider => {
        const result = planSwapFlow({
          quote: usdtQuote(provider),
          ...BASE_INPUT,
          ...USDT_INPUT,
        });
        expect(result).toEqual({ kind: "skip", reason: "usdt-revoke-needed" });
      },
    );

    it("does not flag the revoke case for unrelated providers (e.g. uniswap)", () => {
      const result = planSwapFlow({
        quote: usdtQuote("uniswap"),
        ...BASE_INPUT,
        ...USDT_INPUT,
      });
      expect(result.kind).not.toBe("skip");
    });

    it("does not flag the revoke case when the send currency is not USDT", () => {
      const result = planSwapFlow({
        quote: usdtQuote("okx"),
        ...BASE_INPUT,
        fromCurrencyTicker: "USDC",
        fromCurrencyParentId: "ethereum",
      });
      expect(result.kind).not.toBe("skip");
    });

    it("does not flag the revoke case when USDT lives on a non-Ethereum chain", () => {
      const result = planSwapFlow({
        quote: usdtQuote("okx"),
        ...BASE_INPUT,
        fromCurrencyTicker: "USDT",
        fromCurrencyParentId: "polygon",
      });
      expect(result.kind).not.toBe("skip");
    });

    it("does not flag the revoke case when the existing allowance is zero", () => {
      const result = planSwapFlow({
        quote: makeQuote({
          provider: "okx",
          providerType: "DEX",
          isTokenApprovalRequired: true,
          isApproved: false,
          approvedAmount: "0",
          sendAmount: 350,
        }),
        ...BASE_INPUT,
        ...USDT_INPUT,
      });
      expect(result.kind).not.toBe("skip");
    });

    it("does not flag the revoke case when the existing allowance covers the swap amount", () => {
      const result = planSwapFlow({
        quote: makeQuote({
          provider: "okx",
          providerType: "DEX",
          isTokenApprovalRequired: true,
          isApproved: false,
          approvedAmount: "350000000", // 350 USDT atomised (6 decimals)
          sendAmount: 350,
        }),
        ...BASE_INPUT,
        ...USDT_INPUT,
      });
      expect(result.kind).not.toBe("skip");
    });

    it("does not flag the revoke case when the caller did not pre-resolve the currency", () => {
      const result = planSwapFlow({
        quote: usdtQuote("okx"),
        ...BASE_INPUT,
      });
      expect(result.kind).not.toBe("skip");
    });
  });
});

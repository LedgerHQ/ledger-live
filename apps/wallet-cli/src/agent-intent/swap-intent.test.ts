import { describe, expect, it } from "bun:test";
import type { GetQuotesResponse, Quote } from "@ledgerhq/live-common/wallet-api/Exchange/index";
import {
  AGENT_INTENT_SWAP_PROVIDERS,
  parseSwapAmount,
  quotedReceiveAmount,
  resolveAgentSwapProvider,
} from "./swap-intent";
import { fetchAgentSwapQuote } from "./swap-quote";

const ETH = { id: "ethereum", ticker: "ETH", decimals: 18 };
const USDC = { id: "ethereum/erc20/usd__coin", ticker: "USDC", decimals: 6 };

describe("parseSwapAmount", () => {
  it.each(["1", "0.5", "1250", "0.000001", "10.50"])("accepts %p", value => {
    expect(parseSwapAmount(value, USDC, "amount")).toBe(value);
  });

  it.each(["0", "0.0", "-1", "1e3", "01", "1.", ".5", "1,5", " 1", "1 USDC"])(
    "rejects %p",
    value => {
      expect(() => parseSwapAmount(value, USDC, "amount")).toThrow(
        /--amount .* is not a positive decimal amount/,
      );
    },
  );

  it("rejects more decimal places than the asset has", () => {
    expect(() => parseSwapAmount("0.0000001", USDC, "to-amount")).toThrow(
      "--to-amount 0.0000001 has more than 6 decimal places, the precision of USDC.",
    );
  });
});

describe("quotedReceiveAmount", () => {
  it("rounds down to the asset's precision so the intent never promises more than quoted", () => {
    expect(quotedReceiveAmount(1234.5678919, USDC)).toBe("1234.567891");
  });

  it("never uses exponent notation", () => {
    expect(quotedReceiveAmount(1e-7, ETH)).toBe("0.0000001");
    expect(quotedReceiveAmount(1e21, USDC)).toBe("1000000000000000000000");
  });

  it("returns null when nothing is left after rounding", () => {
    expect(quotedReceiveAmount(0.0000004, USDC)).toBeNull();
    expect(quotedReceiveAmount(0, USDC)).toBeNull();
    expect(quotedReceiveAmount(Number.NaN, USDC)).toBeNull();
  });
});

describe("resolveAgentSwapProvider", () => {
  it.each([...AGENT_INTENT_SWAP_PROVIDERS])("accepts %p", (provider: string) => {
    expect(resolveAgentSwapProvider(provider)).toBe(provider);
  });

  it("maps 1inch to oneinch", () => {
    expect(resolveAgentSwapProvider("1inch")).toBe("oneinch");
  });

  it.each(["uniswap", "changelly", "paraswap"])(
    "rejects %p, which the frontend can't prepare",
    provider => {
      expect(() => resolveAgentSwapProvider(provider)).toThrow(
        `--provider "${provider}" can't be reviewed in the Agent Intent frontend yet.`,
      );
    },
  );
});

describe("fetchAgentSwapQuote", () => {
  const request = {
    from: ETH.id,
    to: USDC.id,
    amount: "0.5",
    sender: "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed",
    providers: AGENT_INTENT_SWAP_PROVIDERS,
  };

  function quote(provider: string, details: Partial<Quote["quoteDetails"]> = {}): Quote {
    return {
      key: provider,
      provider,
      errors: [],
      quoteDetails: { receiveAmount: 1250, ...details },
    } as unknown as Quote;
  }

  function response(overrides: Partial<GetQuotesResponse>): GetQuotesResponse {
    return { quotes: [], providerErrors: [], warnings: [], errors: [], ...overrides };
  }

  it("asks for quotes from the sender to itself among the given providers", async () => {
    const calls: unknown[] = [];
    await fetchAgentSwapQuote(request, async (...args) => {
      calls.push(args[0]);
      return response({ quotes: [quote("oneinch")] });
    });

    expect(calls).toEqual([
      expect.objectContaining({
        providers: [...AGENT_INTENT_SWAP_PROVIDERS],
        data: expect.objectContaining({
          amount: "0.5",
          sendCurrencyId: ETH.id,
          receiveCurrencyId: USDC.id,
          sendAddress: request.sender,
          receiveAddress: request.sender,
        }),
      }),
    ]);
  });

  it("takes the first quote the frontend can prepare", async () => {
    const result = await fetchAgentSwapQuote(request, async () =>
      response({
        quotes: [
          quote("okx", { receiveAmount: 1300, tokenAllowance: { isApproved: false } }),
          quote("velora", { receiveAmount: 1290, permitData: { typedData: { primaryType: "x" } } }),
          {
            ...quote("lifi", { receiveAmount: 1280 }),
            errors: [{ code: "x" }],
          } as unknown as Quote,
          quote("oneinch", { receiveAmount: 1270, tokenAllowance: { isApproved: true } }),
        ],
      }),
    );

    expect(result).toEqual({ provider: "oneinch", receiveAmount: 1270, needsTokenApproval: false });
  });

  it("keeps a Velora quote whose permit data is only its price route, not a permit", async () => {
    const result = await fetchAgentSwapQuote(request, async () =>
      response({
        quotes: [
          quote("velora", {
            receiveAmount: 1290,
            permitData: { priceRoute: { blockNumber: 1 }, providerTag: "velora" },
          }),
        ],
      }),
    );

    expect(result).toEqual({ provider: "velora", receiveAmount: 1290, needsTokenApproval: false });
  });

  it("explains when every quote needs a permit or an approval the frontend can't send", async () => {
    await expect(
      fetchAgentSwapQuote(request, async () =>
        response({ quotes: [quote("okx", { tokenAllowance: { isApproved: false } })] }),
      ),
    ).rejects.toThrow(
      "Every quote needs a Permit2 signature or a token approval the Agent Intent frontend can't " +
        "send (for example a USDT allowance that must first be reset to 0). Approve or reset the " +
        "allowance outside Agent Intent (for example from Ledger Wallet), or pick another provider " +
        "with --provider.",
    );
  });

  describe("selling a token that needs an approval", () => {
    const USDC_CONTRACT = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const USDT_CONTRACT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    const ROUTER = "111111125421ca6dc452d289314280a0f8842a65";
    const approveCalldata = `0x095ea7b3${ROUTER.padStart(64, "0")}${"5f5e100".padStart(64, "0")}`;
    const sellUsdc = { ...request, from: USDC.id, fromContract: USDC_CONTRACT, to: ETH.id };
    const approved = quote("oneinch", {
      receiveAmount: 1270,
      tokenAllowance: { isApproved: true },
    });

    function needingApproval(
      allowance: { to?: string; calldata?: string; approvedAmount?: string } = {},
    ): Quote {
      const {
        to = USDC_CONTRACT.toLowerCase(),
        calldata = approveCalldata,
        approvedAmount,
      } = allowance;
      return quote("okx", {
        receiveAmount: 1300,
        tokenAllowance: {
          isApproved: false,
          ...(approvedAmount === undefined ? {} : { approvedAmount }),
          approvalTransaction: { to, calldata, from: "", gasLimit: 0, gasPrice: 1, value: "0" },
        },
      });
    }

    it("keeps the best quote when the frontend can send its approval, and says so", async () => {
      const result = await fetchAgentSwapQuote(sellUsdc, async () =>
        response({ quotes: [needingApproval(), approved] }),
      );

      expect(result).toEqual({ provider: "okx", receiveAmount: 1300, needsTokenApproval: true });
    });

    it("accepts a USDT approval only when the quote says no allowance is left", async () => {
      const sellUsdt = { ...sellUsdc, fromContract: USDT_CONTRACT };
      const usdtApproval = (approvedAmount?: string) =>
        needingApproval({ to: USDT_CONTRACT.toLowerCase(), approvedAmount });

      const noneLeft = await fetchAgentSwapQuote(sellUsdt, async () =>
        response({ quotes: [usdtApproval("0"), approved] }),
      );
      const someLeft = await fetchAgentSwapQuote(sellUsdt, async () =>
        response({ quotes: [usdtApproval("5"), approved] }),
      );
      const unknown = await fetchAgentSwapQuote(sellUsdt, async () =>
        response({ quotes: [usdtApproval(), approved] }),
      );

      expect(noneLeft.provider).toBe("okx");
      expect(someLeft.provider).toBe("oneinch");
      expect(unknown.provider).toBe("oneinch");
    });

    it.each([
      [
        "an approval of another token",
        needingApproval({ to: "0x6b175474e89094c44da98b954eedeac495271d0f" }),
      ],
      [
        "an approval that isn't an ERC-20 approve call",
        needingApproval({ calldata: "0x12345678" }),
      ],
      [
        "an approval with no transaction to send",
        quote("okx", { receiveAmount: 1300, tokenAllowance: { isApproved: false } }),
      ],
      [
        "an approval that names no token or calldata",
        quote("okx", {
          receiveAmount: 1300,
          tokenAllowance: { isApproved: false, approvalTransaction: {} },
        } as unknown as Partial<Quote["quoteDetails"]>),
      ],
      [
        "an approval flagged only by its tags",
        quote("okx", {
          receiveAmount: 1300,
          tags: { isTokenApprovalRequired: true, isRegistrationRequired: false },
        }),
      ],
      [
        "an approval with a Permit2 signature",
        {
          ...needingApproval(),
          quoteDetails: {
            ...needingApproval().quoteDetails,
            permitData: { typedData: { primaryType: "x" } },
          },
        } as unknown as Quote,
      ],
    ])("skips a quote that needs %s", async (_case, blocked) => {
      const result = await fetchAgentSwapQuote(sellUsdc, async () =>
        response({ quotes: [blocked, approved] }),
      );

      expect(result).toEqual({
        provider: "oneinch",
        receiveAmount: 1270,
        needsTokenApproval: false,
      });
    });

    it("skips an approval when the sold asset has no contract", async () => {
      const result = await fetchAgentSwapQuote(request, async () =>
        response({ quotes: [needingApproval(), approved] }),
      );

      expect(result.provider).toBe("oneinch");
    });
  });

  it("reports why no quote came back", async () => {
    await expect(
      fetchAgentSwapQuote(request, async () =>
        response({
          errors: [{ code: "x", minAmount: "1" } as never],
          providerErrors: [{ provider: "lifi", message: "no route" } as never],
        }),
      ),
    ).rejects.toThrow("No swap quote available: amount too low (minimum: 1); lifi: no route.");
  });
});

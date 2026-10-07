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

    expect(result).toEqual({ provider: "oneinch", receiveAmount: 1270 });
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

    expect(result).toEqual({ provider: "velora", receiveAmount: 1290 });
  });

  it("explains when every quote needs an approval or a permit", async () => {
    await expect(
      fetchAgentSwapQuote(request, async () =>
        response({ quotes: [quote("okx", { tokenAllowance: { isApproved: false } })] }),
      ),
    ).rejects.toThrow(/needs a token approval or Permit2 signature/);
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

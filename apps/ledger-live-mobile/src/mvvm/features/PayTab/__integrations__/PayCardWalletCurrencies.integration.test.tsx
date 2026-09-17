import { renderHook, waitFor } from "@tests/test-renderer";
import { server, http, HttpResponse } from "@tests/server";
import { getEnv } from "@shared/env";
import { useCurrenciesByIds } from "@features/platform-currencies";
import { BAANX_LEDGER_CURRENCY_IDS } from "@domain/entity-card-asset-mapping";

const USDC_ID = "ethereum/erc20/usd__coin";
const USDT_ID = "ethereum/erc20/usd_tether__erc20_";

/** What the registry answers for without CAL: the catalog minus its two tokens. */
const COIN_COUNT = BAANX_LEDGER_CURRENCY_IDS.length - 2;

const CAL_TOKENS: Record<string, unknown> = {
  [USDC_ID]: {
    id: USDC_ID,
    contract_address: "0xA0b86991c6218b36c1D19D4a2e9Eb0cE3606eB48",
    standard: "erc20",
    decimals: 6,
    delisted: false,
    name: "USD Coin",
    ticker: "USDC",
    units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
  },
  [USDT_ID]: {
    id: USDT_ID,
    contract_address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    standard: "erc20",
    decimals: 6,
    delisted: false,
    name: "Tether USD",
    ticker: "USDT",
    units: [{ name: "Tether USD", code: "USDT", magnitude: 6 }],
  },
};

function serveCal(asked: string[]) {
  server.use(
    http.get(`${getEnv("CAL_SERVICE_URL")}/v1/tokens`, ({ request }) => {
      const id = new URL(request.url).searchParams.get("id") ?? "";
      asked.push(id);
      const token = CAL_TOKENS[id];
      return HttpResponse.json(token ? [token] : []);
    }),
  );
}

describe("useCurrenciesByIds for the card catalog", () => {
  it("resolves every card id: coins from the registry, tokens from CAL", async () => {
    const asked: string[] = [];
    serveCal(asked);

    const { result } = renderHook(() => useCurrenciesByIds(BAANX_LEDGER_CURRENCY_IDS));

    // Coins need no request, so they are there before CAL answers.
    expect(result.current.get("bitcoin")?.ticker).toBe("BTC");

    await waitFor(() => expect(result.current.size).toBe(BAANX_LEDGER_CURRENCY_IDS.length));
    expect(result.current.get(USDC_ID)?.ticker).toBe("USDC");
    expect(result.current.get(USDT_ID)?.ticker).toBe("USDT");

    // Only the non-registry ids are asked for, and every one of them is.
    expect(new Set(asked)).toEqual(new Set([USDC_ID, USDT_ID]));
  });

  it("leaves a token out when CAL has nothing for it", async () => {
    const asked: string[] = [];
    server.use(
      http.get(`${getEnv("CAL_SERVICE_URL")}/v1/tokens`, ({ request }) => {
        asked.push(new URL(request.url).searchParams.get("id") ?? "");
        return HttpResponse.json([]);
      }),
    );

    const { result } = renderHook(() => useCurrenciesByIds(BAANX_LEDGER_CURRENCY_IDS));

    // Waited on both lookups having been asked AND the map having settled to the coins only:
    // asserting on `asked` alone passes before the empty answer is even delivered.
    await waitFor(() => expect(new Set(asked)).toEqual(new Set([USDC_ID, USDT_ID])));
    await waitFor(() => expect(result.current.size).toBe(COIN_COUNT));
    expect(result.current.has(USDC_ID)).toBe(false);
    expect(result.current.get("bitcoin")?.ticker).toBe("BTC");
  });
});

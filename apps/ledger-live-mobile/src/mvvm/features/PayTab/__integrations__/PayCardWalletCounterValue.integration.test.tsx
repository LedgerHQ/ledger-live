import { renderHook, waitFor } from "@tests/test-renderer";
import { server, http, HttpResponse } from "@tests/server";
import { getEnv } from "@shared/env";
import { importCountervalues } from "@ledgerhq/live-countervalues/logic";
import { pairId } from "@ledgerhq/live-countervalues/helpers";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { TokenCurrencySchema } from "@domain/entity-currency-token";
import type { State } from "~/reducers/types";
import { usePayCardWalletCounterValue } from "../hooks/usePayCardWalletCounterValue";

const USD = getFiatCurrencyByTicker("USD");
const ETHEREUM = getCryptoCurrencyById("ethereum");
const BITCOIN = getCryptoCurrencyById("bitcoin");

const USDC_ID = "ethereum/erc20/usd__coin";
const USDT_ID = "ethereum/erc20/usd_tether__erc20_";

/** The two card tokens as CAL answers them, in the wire shape `/v1/tokens` returns. */
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

const usdc = TokenCurrencySchema.parse({
  type: "TokenCurrency",
  id: USDC_ID,
  parentCurrencyId: ETHEREUM.id,
  contractAddress: "0xA0b86991c6218b36c1D19D4a2e9Eb0cE3606eB48",
  tokenType: "erc20",
  name: "USD Coin",
  ticker: "USDC",
  units: [{ name: "USD Coin", code: "USDC", magnitude: 6 }],
});

function withRates(state: State): State {
  return {
    ...state,
    countervalues: {
      ...state.countervalues,
      countervalues: {
        ...state.countervalues.countervalues,
        state: importCountervalues(
          {
            status: {},
            [pairId({ from: usdc, to: USD })]: { latest: 1 },
            [pairId({ from: BITCOIN, to: USD })]: { latest: 100_000 },
          },
          state.countervalues.userSettings,
        ),
      },
    },
  };
}

describe("usePayCardWalletCounterValue against CAL", () => {
  it("prices a card token from the currency CAL answered with", async () => {
    const asked: string[] = [];
    server.use(
      http.get(`${getEnv("CAL_SERVICE_URL")}/v1/tokens`, ({ request }) => {
        const id = new URL(request.url).searchParams.get("id") ?? "";
        asked.push(id);
        const token = CAL_TOKENS[id];
        return HttpResponse.json(token ? [token] : []);
      }),
    );

    const { result } = renderHook(() => usePayCardWalletCounterValue(), {
      overrideInitialState: withRates,
    });

    // A coin needs no request, so it prices before CAL has answered.
    expect(result.current("bitcoin", "1")).toBe(10_000_000);

    // 12.5 USDC at 1:1, in the counter value's smallest unit.
    await waitFor(() => expect(result.current(USDC_ID, "12.5")).toBe(1250));

    expect(asked).toEqual(expect.arrayContaining([USDC_ID, USDT_ID]));
  });

  it("leaves the token unpriced when CAL has nothing for it", async () => {
    const asked: string[] = [];
    server.use(
      http.get(`${getEnv("CAL_SERVICE_URL")}/v1/tokens`, ({ request }) => {
        asked.push(new URL(request.url).searchParams.get("id") ?? "");
        return HttpResponse.json([]);
      }),
    );

    const { result } = renderHook(() => usePayCardWalletCounterValue(), {
      overrideInitialState: withRates,
    });

    // Waited on the request, not on a coin: a coin prices before CAL answers, so asserting the
    // token is null without this would pass while the request was still in flight.
    await waitFor(() => expect(asked).toContain(USDC_ID));
    expect(result.current(USDC_ID, "12.5")).toBeNull();
  });
});

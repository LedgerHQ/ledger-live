import { http } from "msw";
import ethMockHourly from "./fixtures/countervalues/ethMockedHourly.json";

const COUNTERVALUES_BASE = "https://countervalues.live.ledger.com/v3";

function createHistoricalHandler(granularity: "daily" | "hourly") {
  return http.get(`${COUNTERVALUES_BASE}/historical/${granularity}/simple`, ({ request }) => {
    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");

    if (from && to === "USD") {
      return new Response(JSON.stringify({ from, to, start, end, rates: ethMockHourly }), {
        status: 200,
      });
    }

    console.warn(
      "MSW Countervalues mock not found for",
      { to, from },
      "please add the value to MSW mock",
    );
    return new Response("Not Found", { status: 404 });
  });
}

const SPOT_RATES: Record<string, number> = {
  bitcoin: 43000,
  ethereum: 2761.27,
  arbitrum: 2761.27,
  scroll: 2761.27,
  base: 2761.27,
  solana: 140.5,
  bsc: 605.8,
  ripple: 0.55,
  tron: 0.11,
  dogecoin: 0.08,
  hedera: 0.07,
};

const handlers = [
  createHistoricalHandler("daily"),
  createHistoricalHandler("hourly"),

  http.get(`${COUNTERVALUES_BASE}/spot/simple`, ({ request }) => {
    const url = new URL(request.url);
    const to = url.searchParams.get("to");
    const froms = url.searchParams.get("froms");

    if (to === "USD") {
      const currencies = froms?.split(",") || [];
      const mockRates: Record<string, number> = {};

      currencies.forEach(currency => {
        if (SPOT_RATES[currency] !== undefined) {
          mockRates[currency] = SPOT_RATES[currency];
        } else {
          // Intentional: unknown currencies default to 1.0 for test stability
          mockRates[currency] = 1.0;
        }
      });

      return new Response(JSON.stringify(mockRates), { status: 200 });
    }

    console.warn(
      "MSW Countervalues mock not found for",
      { to, froms },
      "please add the value to MSW mock",
    );
    return new Response("Not Found", { status: 404 });
  }),
];

export default handlers;

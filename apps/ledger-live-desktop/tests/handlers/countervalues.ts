import { http } from "msw";
import ethMockHourly from "./fixtures/countervalues/ethMockedHourly.json";

const handlers = [
  http.get("https://countervalues.live.ledger.com/v3/historical/daily/simple", ({ request }) => {
    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");

    if (from && to === "USD") {
      return new Response(
        JSON.stringify({
          from,
          to,
          start,
          end,
          rates: ethMockHourly,
        }),
        { status: 200 },
      );
    }

    console.warn(
      "MSW Countervalues mock not found for",
      { to, from },
      "please add the value to MSW mock",
    );
    return new Response("Not Found", { status: 404 });
  }),

  http.get("https://countervalues.live.ledger.com/v3/historical/hourly/simple", ({ request }) => {
    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");

    if (from && to === "USD") {
      return new Response(
        JSON.stringify({
          from,
          to,
          start,
          end,
          rates: ethMockHourly,
        }),
        { status: 200 },
      );
    }

    console.warn(
      "MSW Countervalues mock not found for",
      { to, from },
      "please add the value to MSW mock",
    );
    return new Response("Not Found", { status: 404 });
  }),

  http.get("https://countervalues.live.ledger.com/v3/spot/simple", ({ request }) => {
    const url = new URL(request.url);
    const to = url.searchParams.get("to");
    const froms = url.searchParams.get("froms");

    if (to === "USD") {
      const currencies = froms?.split(",") || [];
      const mockRates: Record<string, number> = {};

      currencies.forEach(currency => {
        if (currency === "ethereum") {
          mockRates[currency] = 2761.27;
        } else if (currency === "bitcoin") {
          mockRates[currency] = 43000;
        } else if (currency === "arbitrum") {
          mockRates[currency] = 2761.27;
        } else if (currency.startsWith("ethereum/erc20/")) {
          mockRates[currency] = 1.0;
        } else if (currency === "scroll") {
          mockRates[currency] = 2761.27;
        } else if (currency === "base") {
          mockRates[currency] = 2761.27;
        } else {
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

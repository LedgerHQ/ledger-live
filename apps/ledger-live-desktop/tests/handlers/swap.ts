import { http, HttpResponse } from "msw";

// Minimal swap currencies response for MSW (bitcoin, ethereum, solana for Market tests)
const swapCurrenciesResponse = {
  from: [
    { network: "bitcoin", supportedCurrencies: ["bitcoin"] },
    { network: "ethereum", supportedCurrencies: ["ethereum"] },
    { network: "solana", supportedCurrencies: ["solana"] },
  ],
  to: [
    { network: "bitcoin", supportedCurrencies: ["bitcoin"] },
    { network: "ethereum", supportedCurrencies: ["ethereum"] },
    { network: "solana", supportedCurrencies: ["solana"] },
  ],
};

const handlers = [
  http.get("https://swap.ledger.com/v5/currencies/all", () =>
    HttpResponse.json(swapCurrenciesResponse),
  ),
];

export default handlers;

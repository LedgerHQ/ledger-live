import { http, HttpResponse } from "msw";

// Ramp catalog mock - bitcoin, ethereum, solana available for buy/sell
const rampCatalogResponse = {
  onRamp: {
    moonpay: ["bitcoin", "ethereum", "solana"],
    transak: ["bitcoin", "ethereum", "solana"],
  },
  offRamp: {
    moonpay: ["bitcoin", "ethereum", "solana"],
    transak: ["bitcoin", "ethereum", "solana"],
  },
};

const handlers = [
  http.get("https://buy.api.live.ledger.com/buy/v1/provider/currencies", () =>
    HttpResponse.json(rampCatalogResponse),
  ),
  http.get("https://buy.api.live.ledger.com/sell/v1/provider/currencies", () =>
    HttpResponse.json(rampCatalogResponse.offRamp),
  ),
];

export default handlers;

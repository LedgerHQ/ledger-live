import { http, HttpResponse } from "msw";

const onRampCurrenciesPerProvider = {
  moonpay: ["bitcoin", "ethereum", "solana"],
  transak: ["bitcoin", "ethereum", "solana"],
};
const buyRampCatalogResponse = {
  onRamp: onRampCurrenciesPerProvider,
};

const handlers = [
  http.get("https://buy.api.live.ledger.com/buy/v1/provider/currencies", () =>
    HttpResponse.json(buyRampCatalogResponse),
  ),
  http.get("https://buy.api.live.ledger.com/sell/v1/provider/currencies", () =>
    HttpResponse.json(onRampCurrenciesPerProvider),
  ),
];

export default handlers;

import { http, HttpResponse } from "msw";

const supportedCvsHandlers = [
  http.get("https://global.api.prd.ledger.com/countervalue/v3/supported/crypto", () =>
    HttpResponse.json([]),
  ),
  http.get("https://global.api.prd.ledger.com/countervalue/v3/supported/fiat", () =>
    HttpResponse.json([
      "AED",
      "AUD",
      "BHD",
      "BRL",
      "CAD",
      "CHF",
      "CLP",
      "CNY",
      "CZK",
      "DKK",
      "EUR",
      "GBP",
      "HKD",
      "HUF",
      "IDR",
      "ILS",
      "INR",
      "JPY",
      "KRW",
      "MXN",
      "MYR",
      "NGN",
      "NOK",
      "NZD",
      "PHP",
      "PKR",
      "PLN",
      "SEK",
      "SGD",
      "THB",
      "TRY",
      "UAH",
      "USD",
      "VND",
      "ZAR",
    ]),
  ),
];

export default supportedCvsHandlers;

import { http, HttpResponse } from "msw";

const CVS_BASE = "https://countervalues.live.ledger.com";

const currencyFiatHandlers = [
  http.get(`${CVS_BASE}/v3/supported/fiat`, () =>
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

export default currencyFiatHandlers;

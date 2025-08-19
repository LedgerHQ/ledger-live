import { http, HttpResponse } from "msw";

const supportedCvsHandlers = [
  http.get("https://countervalues.live.ledger.com/v3/supported/crypto", () =>
    HttpResponse.json([]),
  ),
];

export default supportedCvsHandlers;

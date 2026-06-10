import { http, HttpResponse } from "msw";

const BASE_URL = "https://proxycmc.api.live.ledger.com/v3";

const handlers = [
  http.get(`${BASE_URL}/altcoin-season-index/latest`, () => {
    return HttpResponse.json({
      data: {
        altcoin_index: 75,
        altcoin_marketcap: 1_000_000_000_000,
      },
      status: {
        timestamp: "2024-01-01T00:00:00.000Z",
        error_code: 0,
        error_message: null,
        elapsed: 1,
        credit_count: 1,
        notice: null,
      },
    });
  }),
];

export default handlers;

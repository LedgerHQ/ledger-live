import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { cardApiExtra } from "@shared/api-services";
import { CARD_API_BASE_URL } from "./cardProvider.mock";
import { mockPayCardCashback } from "./cardCashback.mock";
import { mockPayCardTransactions } from "./cardTransactions.mock";

export { CARD_API_BASE_URL };

export const CARD_STATUS_URL = `${CARD_API_BASE_URL}/v1/card/status`;
export const CARD_USER_URL = `${CARD_API_BASE_URL}/v1/user`;
export const CARD_TRANSACTIONS_URL = `${CARD_API_BASE_URL}/v1/card/transactions`;
export const CARD_CASHBACK_URL = `${CARD_API_BASE_URL}/v1/card/cashback`;
export const CARD_DETAILS_TOKEN_URL = `${CARD_API_BASE_URL}/v1/card/details/token`;

export const CARD_STATUS = {
  id: "000000000050277836",
  holderName: "JOHN DOE",
  expiryDate: "2028/01",
  panLast4: "1234",
  status: "ACTIVE",
  type: "VIRTUAL",
  orderedAt: "2023-03-27T17:07:12.662Z",
} as const;

export const CARD_USER = {
  id: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
  verificationState: "VERIFIED",
} as const;

export const CARD_DETAILS_TOKEN = "00000000-0000-4000-8000-000000000000";

/** The schema only accepts an `https:` URL, so the mock image lives under the mock API host. */
export const CARD_DETAILS_IMAGE_URL = `${CARD_API_BASE_URL}/details-image?token=${CARD_DETAILS_TOKEN}`;

export const CARD_DETAILS = {
  token: CARD_DETAILS_TOKEN,
  imageUrl: CARD_DETAILS_IMAGE_URL,
};

/** A holder whose card is live: the baseline every card screen reads. */
export const signedInCardApiHandlers = [
  http.get(CARD_STATUS_URL, () => HttpResponse.json(CARD_STATUS)),
  http.get(CARD_USER_URL, () => HttpResponse.json(CARD_USER)),
  http.get(CARD_TRANSACTIONS_URL, () => HttpResponse.json(mockPayCardTransactions())),
  http.get(CARD_CASHBACK_URL, () => HttpResponse.json(mockPayCardCashback())),
];

export const revealCardDetailsHandler = http.post(CARD_DETAILS_TOKEN_URL, () =>
  HttpResponse.json(CARD_DETAILS),
);

export const revealCardDetailsFailureHandler = http.post(CARD_DETAILS_TOKEN_URL, () =>
  HttpResponse.json({ message: "mint failed" }, { status: 500 }),
);

/** MSW server for a test file; `handlers` are the defaults `resetHandlers` restores. */
export function listenToCardApi(handlers: Parameters<typeof setupServer> = []) {
  const server = setupServer(...handlers);

  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  return server;
}

/** The thunk extra argument a test store hands `cardApi`: a live session against the mock host. */
export function mockCardApiExtraArgument() {
  return cardApiExtra({
    getCardApiBaseUrl: () => CARD_API_BASE_URL,
    getCardBaanxClientKey: () => "client-key",
    isCardUsEnv: () => false,
    readCardSession: () => Promise.resolve({ token: "session-token", sessionId: 1 }),
    isCardSessionCurrent: () => true,
    refreshCardSession: () => Promise.resolve({ kind: "session-replaced" as const }),
  });
}

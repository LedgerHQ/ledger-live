import {
  CARD_API_BASE_URL,
  CARD_CASHBACK_URL,
  CARD_DETAILS,
  CARD_DETAILS_TOKEN_URL,
  CARD_STATUS_URL,
  CARD_TRANSACTIONS_URL,
  CARD_USER_URL,
  listenToCardApi,
  mockCardApiExtraArgument,
  revealCardDetailsFailureHandler,
  revealCardDetailsHandler,
  signedInCardApiHandlers,
} from "./cardApi.mock";
import {
  PayCardCashbackResponseSchema,
  PayCardDetailsTokenResponseSchema,
  PayCardStatusResponseSchema,
  PayCardTransactionsResponseSchema,
  PayCardUserResponseSchema,
} from "./schema";

const server = listenToCardApi(signedInCardApiHandlers);

async function getJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  expect(response.status).toBe(200);
  return response.json();
}

describe("the signed-in card api handlers", () => {
  it.each([
    ["card status", CARD_STATUS_URL, PayCardStatusResponseSchema],
    ["user", CARD_USER_URL, PayCardUserResponseSchema],
    ["transactions", CARD_TRANSACTIONS_URL, PayCardTransactionsResponseSchema],
    ["cashback", CARD_CASHBACK_URL, PayCardCashbackResponseSchema],
  ] as const)("answer the %s as the provider is parsed", async (_, url, schema) => {
    expect(schema.safeParse(await getJson(url)).success).toBe(true);
  });
});

describe("the reveal card details handlers", () => {
  it("mint a token and an image URL the schema accepts", async () => {
    server.use(revealCardDetailsHandler);

    const response = await fetch(CARD_DETAILS_TOKEN_URL, { method: "POST" });
    const body = await response.json();

    expect(body).toEqual(CARD_DETAILS);
    expect(PayCardDetailsTokenResponseSchema.safeParse(body).success).toBe(true);
  });

  it("fail the mint with a server error", async () => {
    server.use(revealCardDetailsFailureHandler);

    const response = await fetch(CARD_DETAILS_TOKEN_URL, { method: "POST" });

    expect(response.status).toBe(500);
  });
});

describe("mockCardApiExtraArgument", () => {
  it("points the card api at the mock host with a live session", async () => {
    const extra = mockCardApiExtraArgument();

    expect(extra.getCardApiBaseUrl()).toBe(CARD_API_BASE_URL);
    expect(extra.getCardBaanxClientKey()).toBe("client-key");
    expect(extra.isCardUsEnv()).toBe(false);
    expect(extra.isCardSessionCurrent(1)).toBe(true);
    await expect(extra.readCardSession()).resolves.toEqual({
      token: "session-token",
      sessionId: 1,
    });
    await expect(extra.refreshCardSession(1, "session-token")).resolves.toEqual({
      kind: "session-replaced",
    });
  });
});

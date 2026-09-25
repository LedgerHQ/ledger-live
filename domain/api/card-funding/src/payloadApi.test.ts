import { configureStore } from "@reduxjs/toolkit";
import { cardApi, cardApiExtra } from "@shared/api-services";
import { cardFundPayloadApi } from "./payloadApi";

const request = {
  transactionId: "7dKAV87vBZW/TA8yCPdRZXoeuphDxa5Rl9qvwu/gQws=",
  inAmount: 30000,
  currency: "btc",
  inAddress: "bc1qcardwallet",
};

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function serializedBuffer(bytes: number[]) {
  return { type: "Buffer", data: bytes };
}

function createStore() {
  return configureStore({
    reducer: { [cardApi.reducerPath]: cardApi.reducer },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        thunk: {
          extraArgument: cardApiExtra({
            getCardApiBaseUrl: () => "https://card.test",
            getCardLegacyApiBaseUrl: () => "https://legacy.card.test",
            getCardBaanxClientKey: () => "client-key",
            isCardUsEnv: () => false,
            readCardSession: () => Promise.resolve({ token: "session-token", sessionId: 1 }),
            isCardSessionCurrent: () => true,
            refreshCardSession: () => Promise.resolve({ kind: "session-replaced" as const }),
          }),
        },
      }).concat(cardApi.middleware),
  });
}

let fetchSpy: jest.SpiedFunction<typeof fetch>;

afterEach(() => {
  fetchSpy.mockRestore();
});

it("asks the configured legacy host for a payload on the Card session", async () => {
  fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
    jsonResponse({
      binaryPayload: serializedBuffer([67, 104, 70]),
      signature: serializedBuffer([39, 203, 5]),
    }),
  );

  const result = await createStore().dispatch(
    cardFundPayloadApi.endpoints.requestCardFundPayload.initiate(request),
  );

  const sent = fetchSpy.mock.calls[0][0] as Request;
  expect(sent.url).toBe("https://legacy.card.test/iframe/api/v2/user/transactions/ledger");
  expect(sent.headers.get("authorization")).toBe("Bearer session-token");
  expect(JSON.parse(await sent.clone().text())).toEqual(request);
  expect(result.data).toEqual({ payload: "ChF", signature: "27cb05" });
});

it("fails with the provider's message when it refuses on a 200", async () => {
  fetchSpy = jest
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(
      jsonResponse({ error: { status: 401, message: "User not logged in", errorCode: null } }),
    );

  const result = await createStore().dispatch(
    cardFundPayloadApi.endpoints.requestCardFundPayload.initiate(request),
  );

  expect(result.error).toMatchObject({ status: "CUSTOM_ERROR", error: "User not logged in" });
});

it("fails when the answer carries no signed payload", async () => {
  fetchSpy = jest
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(jsonResponse({ signature: serializedBuffer([1]) }));

  const result = await createStore().dispatch(
    cardFundPayloadApi.endpoints.requestCardFundPayload.initiate(request),
  );

  expect(result).not.toHaveProperty("data");
  expect(result.error).toMatchObject({ status: "CUSTOM_ERROR" });
});

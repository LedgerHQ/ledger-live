import { configureStore } from "@reduxjs/toolkit";
import { exchangeFundApi, exchangeFundApiExtra } from "@shared/api-services";
import { exchangeFundManagementApi } from "./api";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function request(spy: jest.SpyInstance): Request {
  return spy.mock.calls[0][0] as Request;
}

const remitResponse = {
  sellId: "5b8e7f2c-6c39-4f0e-9d5a-2f6d1b0c7a91",
  payinAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb4",
  providerSig: {
    payload: "CgtjYXJkLXVzZXItMRIJQ2FyZCAxMjM0",
    signature: "MEUCIQDXK5Z9hQ0nJ3f2p1lRr8yVQe6mVYh4tXlA2c8Kk9rWpAIgH1s",
  },
};

const remitRequest = {
  quoteId: "quote-1",
  provider: "baanx",
  fromCurrency: "ethereum/erc20/usd__coin",
  toCurrency: "ethereum/erc20/usd__coin",
  refundAddress: "0x9f2c1a4b8d3e5f6071829304a5b6c7d8e9f01234",
  amountFrom: 50,
  amountTo: 50,
  nonce: "b7d4e1a09c3f",
};

const makeStore = () =>
  configureStore({
    reducer: { [exchangeFundApi.reducerPath]: exchangeFundApi.reducer },
    middleware: gdm =>
      gdm({
        thunk: {
          extraArgument: exchangeFundApiExtra({
            exchangeFundApiBaseUrl: "https://exchange.test",
            ledgerClientVersion: "llm/1.2.3",
          }),
        },
      }).concat(exchangeFundApi.middleware),
  });

let fetchSpy: jest.SpyInstance;

afterEach(() => {
  fetchSpy?.mockRestore();
});

describe("remitFundCard", () => {
  it("posts the fund request and returns the signed payload", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(remitResponse));

    const store = makeStore();
    const result = await store.dispatch(
      exchangeFundManagementApi.endpoints.remitFundCard.initiate(remitRequest),
    );

    expect(request(fetchSpy).url).toBe("https://exchange.test/exchange/v1/fund/card/remit");
    expect(request(fetchSpy).method).toBe("POST");
    expect(request(fetchSpy).headers.get("x-ledger-client-version")).toBe("llm/1.2.3");
    expect(JSON.parse(await request(fetchSpy).clone().text())).toEqual(remitRequest);
    expect(result.data).toEqual(remitResponse);
  });

  it("sends the device nonce, which binds the payload to this device", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(remitResponse));

    const store = makeStore();
    await store.dispatch(exchangeFundManagementApi.endpoints.remitFundCard.initiate(remitRequest));

    const body = JSON.parse(await request(fetchSpy).clone().text());
    expect(body.nonce).toBe("b7d4e1a09c3f");
  });

  it("omits the quote id when the caller has none", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(remitResponse));
    const { quoteId: _quoteId, ...withoutQuote } = remitRequest;

    const store = makeStore();
    const result = await store.dispatch(
      exchangeFundManagementApi.endpoints.remitFundCard.initiate(withoutQuote),
    );

    const body = JSON.parse(await request(fetchSpy).clone().text());
    expect(body).not.toHaveProperty("quoteId");
    expect(result.data).toEqual(remitResponse);
  });

  it("rejects a response with no provider signature", async () => {
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        jsonResponse({ sellId: remitResponse.sellId, payinAddress: remitResponse.payinAddress }),
      );

    const store = makeStore();
    const result = await store.dispatch(
      exchangeFundManagementApi.endpoints.remitFundCard.initiate(remitRequest),
    );

    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();
  });

  it("rejects a response with no payin address, which would leave nowhere to send", async () => {
    fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ ...remitResponse, payinAddress: "" }));

    const store = makeStore();
    const result = await store.dispatch(
      exchangeFundManagementApi.endpoints.remitFundCard.initiate(remitRequest),
    );

    expect(result.data).toBeUndefined();
    expect(result.error).toBeDefined();
  });
});

describe("confirmFund", () => {
  it("posts the accepted webhook for the quote", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));

    const store = makeStore();
    await store.dispatch(
      exchangeFundManagementApi.endpoints.confirmFund.initiate({
        quoteId: "quote-1",
        provider: "baanx",
      }),
    );

    expect(request(fetchSpy).url).toBe(
      "https://exchange.test/history/webhook/v1/transaction/quote-1/accepted",
    );
    expect(request(fetchSpy).method).toBe("POST");
  });
});

describe("cancelFund", () => {
  it("posts the cancelled webhook with the failure that caused it", async () => {
    fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({}));

    const store = makeStore();
    await store.dispatch(
      exchangeFundManagementApi.endpoints.cancelFund.initiate({
        quoteId: "quote-1",
        provider: "baanx",
        statusCode: "UserRefusedOnDevice",
        errorMessage: "Transaction refused on device",
      }),
    );

    expect(request(fetchSpy).url).toBe(
      "https://exchange.test/history/webhook/v1/transaction/quote-1/cancelled",
    );
    expect(JSON.parse(await request(fetchSpy).clone().text())).toEqual({
      provider: "baanx",
      statusCode: "UserRefusedOnDevice",
      errorMessage: "Transaction refused on device",
    });
  });
});

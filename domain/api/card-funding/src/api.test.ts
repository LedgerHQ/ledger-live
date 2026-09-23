import { configureStore } from "@reduxjs/toolkit";
import {
  exchangeTransactionManagerApi,
  exchangeTransactionManagerApiExtra,
} from "@shared/api-services";
import { cardFundingApi } from "./api";

const remitRequest = {
  quoteId: "88c80c6b-c8a8-4af5-b594-e4454323d06c",
  provider: "baanx",
  fromCurrency: "ethereum/erc20/usd__coin",
  toCurrency: "ethereum/erc20/usd__coin",
  refundAddress: "0x1111111111111111111111111111111111111111",
  amountFrom: 50,
  amountTo: 50,
  nonce: "device-transaction-id",
};

const remitResponse = {
  sellId: "fund-order-id",
  payinAddress: "0x2222222222222222222222222222222222222222",
  providerSig: {
    payload: "signed-payload",
    signature: "provider-signature",
  },
};

function response(body?: unknown): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function createStore() {
  return configureStore({
    reducer: {
      [exchangeTransactionManagerApi.reducerPath]: exchangeTransactionManagerApi.reducer,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        thunk: {
          extraArgument: exchangeTransactionManagerApiExtra({
            exchangeTransactionManagerApiBaseUrl: "https://exchange.test",
            ledgerClientVersion: "lld/1.2.3",
          }),
        },
      }).concat(exchangeTransactionManagerApi.middleware),
  });
}

function request(fetchSpy: jest.SpiedFunction<typeof fetch>): Request {
  return fetchSpy.mock.calls[0][0] as Request;
}

let fetchSpy: jest.SpiedFunction<typeof fetch>;

afterEach(() => {
  fetchSpy.mockRestore();
});

it("remits a Card Fund with a quote id", async () => {
  fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(response(remitResponse));
  const store = createStore();

  const result = await store.dispatch(
    cardFundingApi.endpoints.remitCardFund.initiate(remitRequest),
  );

  expect(request(fetchSpy).url).toBe("https://exchange.test/exchange/v1/fund/card/remit");
  expect(request(fetchSpy).headers.get("x-ledger-client-version")).toBe("lld/1.2.3");
  expect(JSON.parse(await request(fetchSpy).clone().text())).toEqual(remitRequest);
  expect(result.data).toEqual(remitResponse);
});

it("confirms the returned order with the broadcast transaction hash", async () => {
  fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(response());
  const store = createStore();

  await store.dispatch(
    cardFundingApi.endpoints.confirmCardFund.initiate({
      orderId: "fund/order",
      provider: "baanx",
      transactionId: "operation-hash",
    }),
  );

  expect(request(fetchSpy).url).toBe(
    "https://exchange.test/history/webhook/v1/transaction/fund%2Forder/accepted",
  );
  expect(JSON.parse(await request(fetchSpy).clone().text())).toEqual({
    provider: "baanx",
    transactionId: "operation-hash",
  });
});

it("reports a failed order without putting the order id in the body", async () => {
  fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(response());
  const store = createStore();

  await store.dispatch(
    cardFundingApi.endpoints.cancelCardFund.initiate({
      orderId: "fund-order-id",
      provider: "baanx",
      statusCode: "TransactionRefusedOnDevice",
      errorMessage: "User refused",
    }),
  );

  expect(request(fetchSpy).url).toBe(
    "https://exchange.test/history/webhook/v1/transaction/fund-order-id/cancelled",
  );
  expect(JSON.parse(await request(fetchSpy).clone().text())).toEqual({
    provider: "baanx",
    statusCode: "TransactionRefusedOnDevice",
    errorMessage: "User refused",
  });
});

it("rejects a remit response without the provider signature", async () => {
  fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
    response({
      sellId: remitResponse.sellId,
      payinAddress: remitResponse.payinAddress,
    }),
  );
  const store = createStore();

  const result = await store.dispatch(
    cardFundingApi.endpoints.remitCardFund.initiate(remitRequest),
  );

  expect(result).toHaveProperty("error");
  expect(result).not.toHaveProperty("data");
});

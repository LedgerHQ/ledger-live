import { http, HttpResponse } from "msw";
import { setupServer, type SetupServer } from "msw/node";
import type {
  BalanceResponse,
  EstimatedFeesResponse,
  NetworkStatusResponse,
  TransactionsResponse,
  BroadcastTransactionResponse,
  FetchERC20TransactionsResponse,
  ERC20BalanceResponse,
} from "../../../types";

export const TEST_ENDPOINT = "https://test-filecoin-api.example.com";
const V2 = `${TEST_ENDPOINT}/v2`;

/**
 * Handler map for the Filecoin REST API.
 * Each key corresponds to a specific endpoint. All fields are optional —
 * only provide the endpoints your test exercises. Unmocked endpoints will
 * trigger MSW's `onUnhandledRequest: "error"`.
 */
export type FilecoinApiHandlers = {
  getBalance?: (address: string) => BalanceResponse;
  getNetworkStatus?: () => NetworkStatusResponse;
  getTransactions?: (address: string, params: URLSearchParams) => TransactionsResponse;
  estimateFees?: (body: unknown) => EstimatedFeesResponse;
  broadcast?: (body: unknown) => BroadcastTransactionResponse;
  getERC20Balance?: (contractAddr: string, ethAddr: string) => ERC20BalanceResponse;
  getERC20Transactions?: (
    address: string,
    params: URLSearchParams,
  ) => FetchERC20TransactionsResponse;
};

/**
 * Creates MSW HTTP handlers from a handler map.
 */
export function filecoinHandlers(handlers: FilecoinApiHandlers) {
  const h = [];

  if (handlers.getBalance) {
    h.push(
      http.get(`${V2}/addresses/:address/balance`, ({ params }) => {
        return HttpResponse.json(handlers.getBalance!(params.address as string));
      }),
    );
  }

  if (handlers.getNetworkStatus) {
    h.push(
      http.get(`${V2}/network/status`, () => {
        return HttpResponse.json(handlers.getNetworkStatus!());
      }),
    );
  }

  if (handlers.getTransactions) {
    h.push(
      http.get(`${V2}/addresses/:address/transactions`, ({ params, request }) => {
        const url = new URL(request.url);
        return HttpResponse.json(
          handlers.getTransactions!(params.address as string, url.searchParams),
        );
      }),
    );
  }

  if (handlers.estimateFees) {
    h.push(
      http.post(`${V2}/fees/estimate`, async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json(handlers.estimateFees!(body));
      }),
    );
  }

  if (handlers.broadcast) {
    h.push(
      http.post(`${V2}/transaction/broadcast`, async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json(handlers.broadcast!(body));
      }),
    );
  }

  if (handlers.getERC20Balance) {
    h.push(
      http.get(`${V2}/contract/:contractAddr/address/:ethAddr/balance/erc20`, ({ params }) => {
        return HttpResponse.json(
          handlers.getERC20Balance!(params.contractAddr as string, params.ethAddr as string),
        );
      }),
    );
  }

  if (handlers.getERC20Transactions) {
    h.push(
      http.get(`${V2}/addresses/:address/transactions/erc20`, ({ params, request }) => {
        const url = new URL(request.url);
        return HttpResponse.json(
          handlers.getERC20Transactions!(params.address as string, url.searchParams),
        );
      }),
    );
  }

  return h;
}

export const server: SetupServer = setupServer();


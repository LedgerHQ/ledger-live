import { http, HttpResponse } from "msw";
import { type SetupServer, setupServer } from "msw/node";
import type {
  FetchAccountBalanceResponse,
  FetchAccountTransactionsResponse,
  FetchDelegateAccountResponse,
  FetchEpochInfoResponse,
  FetchNetworkStatusResponse,
  GetValidatorsResponse,
  RosettaBlockInfoResponse,
  RosettaMetadataResponse,
  RosettaPreprocessResponse,
  RosettaSubmitResponse,
} from "../../network/types";

export const TEST_ROSETTA_ENDPOINT = "https://test-mina-rosetta.example.com";
export const TEST_GRAPHQL_ENDPOINT = "https://test-mina-graphql.example.com";
export const TEST_VALIDATORS_ENDPOINT = "https://test-mina-validators.example.com";

type RosettaRoute =
  | "/network/status"
  | "/account/balance"
  | "/search/transactions"
  | "/block"
  | "/construction/preprocess"
  | "/construction/metadata"
  | "/construction/submit";

type RosettaRouteResponseMap = {
  "/network/status": FetchNetworkStatusResponse;
  "/account/balance": FetchAccountBalanceResponse;
  "/search/transactions": FetchAccountTransactionsResponse;
  "/block": RosettaBlockInfoResponse;
  "/construction/preprocess": RosettaPreprocessResponse;
  "/construction/metadata": RosettaMetadataResponse;
  "/construction/submit": RosettaSubmitResponse;
};

export type RosettaRouteHandlers = {
  [K in RosettaRoute]?: (body: unknown) => RosettaRouteResponseMap[K];
};

export type GraphqlHandler = (
  body: unknown,
) => FetchEpochInfoResponse | FetchDelegateAccountResponse;

export type ValidatorsHandler = (url: URL) => GetValidatorsResponse;

function invokeRouteHandler(
  handler: ((body: unknown) => unknown) | undefined,
  route: string,
  body: unknown,
): HttpResponse {
  if (!handler) {
    return HttpResponse.json(
      { code: 404, message: `No handler for route: ${route}`, retriable: false },
      { status: 404 },
    );
  }
  try {
    return HttpResponse.json(handler(body));
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return HttpResponse.json({ code: 500, message, retriable: false }, { status: 500 });
  }
}

export function rosettaHandlers(routeHandlers: RosettaRouteHandlers) {
  const handlers = routeHandlers as Record<string, (body: unknown) => unknown>;
  const routes: RosettaRoute[] = [
    "/network/status",
    "/account/balance",
    "/search/transactions",
    "/block",
    "/construction/preprocess",
    "/construction/metadata",
    "/construction/submit",
  ];

  return routes
    .filter(route => handlers[route])
    .map(route =>
      http.post(`${TEST_ROSETTA_ENDPOINT}${route}`, async ({ request }) => {
        const body = await request.json();
        return invokeRouteHandler(handlers[route], route, body);
      }),
    );
}

export function graphqlHandler(handler: GraphqlHandler) {
  return http.post(TEST_GRAPHQL_ENDPOINT, async ({ request }) => {
    const body = await request.json();
    return invokeRouteHandler(handler as (body: unknown) => unknown, "graphql", body);
  });
}

export function validatorsHandler(handler: ValidatorsHandler) {
  return http.get(`${TEST_VALIDATORS_ENDPOINT}`, ({ request }) => {
    const url = new URL(request.url);
    return invokeRouteHandler(handler as unknown as (body: unknown) => unknown, "validators", url);
  });
}

export const server: SetupServer = setupServer();

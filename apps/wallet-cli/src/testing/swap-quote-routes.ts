import type { Route } from "./mock-server";

/** Minimal `RawQuote` row for `/quote` — enough for `normalizeQuote` + `buildQuoteDetails`. */
const MOCK_QUOTE_ROW = {
  type: "float" as const,
  provider: "paraswap",
  providerType: "DEX" as const,
  amountFrom: 0.1,
  amountTo: 0.05,
  exchangeRate: 3000,
  slippage: 0.5,
  networkFees: { currency: "ethereum", gasLimit: "21000" },
  tags: {
    isRegistrationRequired: false,
    isTokenApprovalRequired: false,
  },
  key: "paraswap-key",
  liquiditySource: "AMM" as const,
};

const MOCK_PROVIDER_ROW = {
  name: "ParaSwap",
  partner_id: "paraswap",
  public_key: "1234567890abcdef",
  public_key_curve: "secp256k1" as const,
  service_app_version: 2,
  descriptor: {
    data: "09abcd",
    signatures: {
      prod: "a1b2c3",
      test: "d1e2f3",
    },
  },
};

export const SWAP_QUOTE_ARGS = [
  "swap",
  "quote",
  "--from",
  "ethereum",
  "--to",
  "bitcoin",
  "--from-account",
  "ethereum-1",
  "--to-account",
  "ethereum-1",
  "--amount",
  "0.1",
];

type SwapQuoteRouteOptions = {
  /** Overrides the `/quote` answer, which defaults to one paraswap quote. */
  quote?: Pick<Route, "response" | "status">;
  /** Answers 401 to any `/quote` request that carries a token. */
  rejectTokens?: boolean;
};

/**
 * Swap API routes answering one paraswap quote for {@link SWAP_QUOTE_ARGS}, recording the
 * `authorization` header of every `/quote` request (`null` when it carried no token).
 */
export function makeSwapQuoteRoutes({
  quote = { response: [MOCK_QUOTE_ROW] },
  rejectTokens = false,
}: SwapQuoteRouteOptions = {}): { routes: Route[]; quoteAuthorizations: (string | null)[] } {
  const quoteAuthorizations: (string | null)[] = [];
  const routes: Route[] = [
    {
      method: "GET",
      match: /\/v1\/partners(\?|$)/,
      response: [MOCK_PROVIDER_ROW],
    },
    {
      method: "GET",
      match: /\/v1\/tokens(\?|$)/,
      response: [],
    },
    {
      method: "GET",
      match: /\/quote(\?|$)/,
      ...quote,
      onRequest: request => {
        const authorization = request.headers.get("authorization");
        quoteAuthorizations.push(authorization);
        if (rejectTokens && authorization) {
          return Response.json({ message: "invalid token" }, { status: 401 });
        }
      },
    },
  ];
  return { routes, quoteAuthorizations };
}

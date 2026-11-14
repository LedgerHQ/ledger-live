import "../live-common-setup";
import { crypto } from "@ledgerhq/hw-ledger-key-ring-protocol";
import {
  encodeSendIntentTlv,
  encodeSwapIntentTlv,
  hexToBytes,
  sha256Digest,
  type SendIntent,
  type SwapIntent,
} from "@ledgerhq/agent-intent-sdk";
import type { FakeAgentIntentService } from "./agent-intent-service";
import type { Route } from "./mock-server";
import { makeSwapQuoteRoutes } from "./swap-quote-routes";

/** An intent the CLI submitted: who signed it, what it says, and whether the signature verifies. */
export type SubmittedIntent = {
  issuer: string;
  intent: Record<string, unknown>;
  signatureValid: boolean;
};

/** The intents the service was asked to create, their signatures checked over the canonical TLV. */
export function submittedIntents(service: FakeAgentIntentService): SubmittedIntent[] {
  return service.calls("createIntent").map(({ body }) => {
    // A send's amount is a bare JSON integer that may exceed 2^53: kept as its digits.
    const { issuer, signature, nonce, intent } = JSON.parse(
      body.replace(/"amount":(\d+)/, '"amount":"$1"'),
    );
    const tlv =
      intent.type === "swap"
        ? encodeSwapIntentTlv(intent as SwapIntent, nonce)
        : encodeSendIntentTlv(intent as SendIntent, nonce);
    return {
      issuer,
      intent,
      signatureValid: crypto.verify(sha256Digest(tlv), hexToBytes(signature), hexToBytes(issuer)),
    };
  });
}

export type CalToken = {
  id: string;
  network: "ethereum" | "solana";
  address: string;
  ticker: string;
  name: string;
  decimals: number;
};

function calRow({ id, network, address, ticker, name, decimals }: CalToken) {
  return {
    id,
    contract_address: address,
    standard: network === "ethereum" ? "erc20" : "spl",
    decimals,
    delisted: false,
    name,
    ticker,
    units: [{ code: ticker, name: ticker, magnitude: decimals }],
  };
}

/**
 * CAL's `/v1/tokens`, knowing only `tokens`: by contract, by id, and by ticker (case-sensitively,
 * like CAL). Records each ticker search as `<network> <ticker>`.
 */
export class FakeCal {
  readonly tickerSearches: string[] = [];

  constructor(private readonly tokens: CalToken[]) {}

  readonly routes: Route[] = [
    {
      method: "GET",
      match: /\/v1\/tokens\?/,
      response: [],
      onRequest: request => Response.json(this.#answer(new URL(request.url).searchParams)),
    },
  ];

  #answer(query: URLSearchParams) {
    const network = query.get("network");
    const ticker = query.get("ticker");
    const address = query.get("contract_address")?.toLowerCase();
    const id = query.get("id");
    if (ticker) this.tickerSearches.push(`${network} ${ticker}`);
    const matches = (token: CalToken) => {
      if (ticker) return token.network === network && token.ticker === ticker;
      if (address) return token.network === network && token.address.toLowerCase() === address;
      return token.id === id;
    };
    return this.tokens.filter(matches).map(calRow);
  }
}

const TOKEN_PROGRAM_OWNERS = {
  "spl-token": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "spl-token-2022": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PxnBkcEnZF9pp7",
};

/** The Solana node, answering `getAccountInfo` for each mint with the program that owns it. */
export function solanaMintsRoute(
  programs: Record<string, keyof typeof TOKEN_PROGRAM_OWNERS>,
): Route {
  return {
    method: "POST",
    match: /^\/$/,
    response: null,
    onRequest: async request => {
      const { id, params } = (await request.json()) as { id: unknown; params: [string] };
      const program = programs[params[0]];
      const value = program && {
        data: {
          program,
          parsed: {
            type: "mint",
            info: {
              decimals: 6,
              freezeAuthority: null,
              isInitialized: true,
              mintAuthority: null,
              supply: "1",
            },
          },
          space: 82,
        },
        executable: false,
        lamports: 1461600,
        owner: TOKEN_PROGRAM_OWNERS[program],
        rentEpoch: 0,
        space: 82,
      };
      return Response.json({
        jsonrpc: "2.0",
        id,
        result: { context: { slot: 1 }, value: value ?? null },
      });
    },
  };
}

type QuoteOptions = {
  providerType?: "DEX" | "CEX";
  /** Contract of the sold token, when the quote needs its approval first. */
  approves?: string;
  /** The allowance already granted, in base units. */
  approvedAmount?: string;
  permit?: boolean;
};

const SPENDER = "1111111254eeb25477b68fb85ed929f73a960582";

/** A Swap API `/quote` row from `provider`, receiving `amountTo`. */
export function quoteRow(
  provider: string,
  amountTo: number,
  { providerType = "DEX", approves, approvedAmount = "0", permit = false }: QuoteOptions = {},
) {
  return {
    type: "float",
    provider,
    providerType,
    amountFrom: 0.5,
    amountTo,
    exchangeRate: amountTo,
    slippage: 0.5,
    networkFees: { currency: "ethereum", gasLimit: "21000" },
    tags: { isRegistrationRequired: false, isTokenApprovalRequired: approves !== undefined },
    key: `${provider}-key`,
    ...(approves && {
      tokenAllowanceData: {
        isApproved: false,
        approvedAmount,
        approvalTransaction: {
          to: approves,
          from: "0x0000000000000000000000000000000000000000",
          calldata: `0x095ea7b3${"0".repeat(24)}${SPENDER}${"f".repeat(64)}`,
          gasLimit: 50000,
          gasPrice: 1,
          value: "0",
        },
      },
    }),
    ...(permit && { customFields: { permitData: { primaryType: "PermitSingle" } } }),
  };
}

/** The Swap API answering each `/quote` with the scripted rows, recording every query. */
export class FakeSwapQuotes {
  readonly queries: URLSearchParams[] = [];
  #rows: unknown[] = [];

  readonly routes: Route[] = [
    {
      method: "GET",
      match: /\/quote(\?|$)/,
      response: null,
      onRequest: request => {
        this.queries.push(new URL(request.url).searchParams);
        return Response.json(this.#rows);
      },
    },
    ...makeSwapQuoteRoutes().routes,
  ];

  answer(...rows: unknown[]): this {
    this.#rows = rows;
    return this;
  }

  reset(): void {
    this.queries.length = 0;
    this.#rows = [];
  }
}

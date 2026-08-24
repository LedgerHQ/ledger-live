import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import {
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import BigNumber from "bignumber.js";
import { HttpResponse, bypass, http } from "msw";
import { setupServer } from "msw/node";
import type { KaspaAccount } from "@ledgerhq/coin-kaspa/types/bridge";
import { toMainnetAddress } from "./addressUtils";

export const KASPA = getCryptoCurrencyById("kaspa");

// 1 KAS = 100_000_000 sompi (magnitude 8)
export const ONE_KAS = 100_000_000;
// Minimum balance to wait for before starting the scenario
export const INITIAL_FUND_SOMPI = BigInt(1_000 * ONE_KAS); // 1000 KAS

function makeBaseAccount(id: string, xpub: string, address: string): KaspaAccount {
  const derivationMode = "";
  const currency = KASPA;
  const scheme = getDerivationScheme({ derivationMode, currency });
  const freshAddressPath = runDerivationScheme(scheme, currency, {
    account: 0,
    node: 0,
    address: 0,
  });

  return {
    type: "Account",
    id,
    xpub,
    seedIdentifier: xpub,
    used: false,
    swapHistory: [],
    derivationMode,
    currency,
    index: 0,
    freshAddress: address,
    freshAddressPath,
    creationDate: new Date(),
    lastSyncDate: new Date(0),
    blockHeight: 0,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    nfts: [],
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
  } as unknown as KaspaAccount;
}

// Build a bare-bones KaspaAccount for the legacy bridge strategy. The account id follows
// the pattern from bridgeDatasetTest.ts: "js:2:kaspa:<xpub>:" (empty derivation mode).
// makeSync extracts the 99-byte xpub from the id; the legacy synchronization uses it to
// scan all HD addresses via scanAddresses(compressedPublicKey, chainCode).
export function makeAccount(address: string, xpub: string): KaspaAccount {
  return makeBaseAccount(`js:2:kaspa:${xpub}:`, xpub, address);
}

// Build a bare-bones account for the generic-adapter (Alpaca) strategy. The account id
// encodes the kaspa address itself (not the xpub), mirroring what genericGetAccountShape
// writes back via encodeAccountId. makeSync extracts the id's xpubOrAddress segment and
// passes it to coinModuleApi.getBalance/listOperations as the queried address — so this
// must be a valid kaspa: address, not the 99-byte xpub.
export function makeGenericAdapterAccount(address: string): KaspaAccount {
  return makeBaseAccount(`js:2:kaspa:${address}:`, address, address);
}

const KASPA_REST_BASE = "http://localhost:8080";

// Intercept external Ledger-service calls and reject unhandled non-local requests.
// The coin module talks only to API_KASPA_ENDPOINT (local REST server), so no blockchain
// endpoints need interception.
export function initMSW(): () => void {
  const mockServer = setupServer(
    http.get("https://countervalues.api.live.ledger.com/*", () => HttpResponse.json({})),
    http.get("https://global.api.prd.ledger.com/cal/v1/tokens", () => HttpResponse.json([])),
    http.get("https://global.api.prd.ledger.com/cal/v1/certificates", () => HttpResponse.json([])),
    // The simnet REST server can leak `kaspasim:`-prefixed addresses for some endpoints (e.g.
    // POST /addresses/utxos returns the indexer's raw stored address string rather than
    // re-deriving one under NETWORK_TYPE=mainnet, unlike full-transactions-page which does).
    // coin-kaspa only ever knows `kaspa:` addresses, so pass every local REST call through and
    // rewrite every kaspasim: address in the response body before the coin module sees it.
    // Must decode + recompute the bech32 checksum (toMainnetAddress), not just swap the prefix
    // text: the checksum is a function of the prefix string, so a plain text substitution
    // produces a syntactically kaspa:-looking address with the wrong checksum tail — a string
    // that will never match any real kaspa: address the wallet knows about. Coin-tester-only
    // normalization — zero coin-module changes.
    http.all(`${KASPA_REST_BASE}/*`, async ({ request }) => {
      const response = await fetch(bypass(request));
      const body = await response.text();
      const normalized = body.replace(/kaspasim:[a-z0-9]+/g, match => toMainnetAddress(match));

      // Rebuild headers explicitly rather than copying response.headers wholesale: the local
      // REST server sends hop-by-hop headers (Transfer-Encoding: chunked, Connection) that are
      // forbidden on a synthetic Response. Copying them silently corrupted header construction —
      // this dropped X-Next-Page-After too, which made listOperations/getAllTransactions look
      // permanently stuck on page 1 (500-item cap) even though the real server had more pages.
      // Only forward the headers the coin module actually reads.
      const headers = new Headers();
      const contentType = response.headers.get("content-type");
      if (contentType) headers.set("content-type", contentType);
      const nextPageAfter = response.headers.get("x-next-page-after");
      if (nextPageAfter) headers.set("x-next-page-after", nextPageAfter);

      return new HttpResponse(normalized, { status: response.status, headers });
    }),
  );

  mockServer.listen({
    onUnhandledRequest: request => {
      const { hostname } = new URL(request.url);
      if (hostname === "127.0.0.1" || hostname === "localhost") return;
      throw new Error(`Unhandled external request: ${request.method} ${request.url}`);
    },
  });

  return () => mockServer.close();
}

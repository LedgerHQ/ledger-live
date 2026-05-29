import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import type { Account } from "@ledgerhq/types-live";

export const TRON = getCryptoCurrencyById("tron");

/** Local Tron HTTP API (trontools/quickstart). The indexer fetches from here directly. */
export const TRON_LOCAL_URL = "http://127.0.0.1:9090";

/**
 * Fake TronGrid host. coin-tron talks to this URL via `live-network`; MSW
 * intercepts every request and the indexer routes the call to the local node.
 */
export const TRON_MOCK_URL = "https://api.mock.trongrid.io";

/**
 * Static recipient used by every "send" scenario transaction. This is
 * `accounts[1]` of `trontools/quickstart` when launched with the pinned
 * mnemonic configured in `docker-compose.yml`. Pre-funded so transfers always
 * succeed regardless of activation-fee logic, and distinct from the
 * deployer/funding address (`TPL66VK2gCXNCD7EJg9pgJRfqcRazjhUZY`) to avoid
 * sender-equals-recipient assertion confusion.
 */
export const RECIPIENT = "TPjjvMwjPoDC32V2dGDYTkLH4E5LAtBZ6C";

/** Deterministic fixture mnemonic — generated once, checked in for reproducibility. */
export const SENDER_MNEMONIC =
  "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

export const TRON_DERIVATION_PATH = "44'/195'/0'/0/0";

export function makeAccount(address: string, xpub: string): Account {
  const id = `js:2:tron:${address}:`;
  return {
    type: "Account",
    id,
    xpub,
    subAccounts: [],
    seedIdentifier: xpub,
    used: true,
    swapHistory: [],
    derivationMode: "",
    currency: TRON,
    index: 0,
    nfts: [],
    freshAddress: address,
    freshAddressPath: TRON_DERIVATION_PATH,
    creationDate: new Date(),
    lastSyncDate: new Date(0),
    blockHeight: 0,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
  };
}

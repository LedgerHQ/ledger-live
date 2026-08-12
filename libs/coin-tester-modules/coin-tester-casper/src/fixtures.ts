import BigNumber from "bignumber.js";
import type { CasperAccount, CasperCoinConfig } from "@ledgerhq/coin-casper/types";
import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import {
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";

export const DEVNET_SERVICE_NAME = "casper-devnet";

// The bare host and `/` both return 404 — the sidecar serves RPC on `/rpc`.
export const DEVNET_RPC_URL = "http://localhost:11101/rpc";

export const DEVNET_CHAIN_NAME = "casper";

// Validators occupy derivation indices 0..n; users start at 100.
const USER_DERIVATION_INDEX_OFFSET = 100;

export const casper = getCryptoCurrencyById("casper");

const DERIVATION_MODE = "casper_wallet";

/** The form `account.freshAddressPath` uses, and the key of the signer's key map. */
export const liveDerivationPath = (index: number): string =>
  runDerivationScheme(
    getDerivationScheme({ derivationMode: DERIVATION_MODE, currency: casper }),
    casper,
    { account: USER_DERIVATION_INDEX_OFFSET + index },
  );

/** The devnet CLI wants the `m/` prefix; Ledger Live's own path form omits it. */
export const userDerivationPath = (index: number): string => `m/${liveDerivationPath(index)}`;

// Prefunded at genesis, so no faucet step is needed.
export const GENESIS_USER_BALANCE_MOTES = new BigNumber("1e36");

// Port 1 refuses immediately, so an accidental fetchTxs fails fast instead of hanging.
const UNUSED_INDEXER_URL = "http://127.0.0.1:1/";

// Mirrors `libs/ledger-live-common/src/families/casper/config.ts` with the infra URLs swapped.
export const localCoinConfig: ReturnType<CasperCoinConfig> = {
  status: {
    type: "active",
    features: [
      { id: "blockchain_txs", status: "active" },
      { id: "staking_txs", status: "active" },
    ],
  },
  infra: {
    API_CASPER_NODE_ENDPOINT: DEVNET_RPC_URL,
    API_CASPER_INDEXER: UNUSED_INDEXER_URL,
  },
};

export const SENDER_USER_INDEX = 0;
export const RECIPIENT_USER_INDEX = 1;

// Untouched by the transfer scenario, so devnet.test.ts's genesis-balance assertion always holds.
export const DEVNET_SANITY_USER_INDEX = 2;

const ONE_CSPR_MOTES = new BigNumber(1e9);

// Above CASPER_MINIMUM_VALID_AMOUNT_MOTES (2.5 CSPR).
export const TRANSFER_AMOUNT_MOTES = ONE_CSPR_MOTES.times(10);

export const TRANSFER_ID = "1";

// One below Number.MAX_SAFE_INTEGER, the largest transfer id the stack can
// craft — createNewTransaction's parseInt loses precision above 2^53.
export const LARGE_TRANSFER_ID = "9007199254740990";

// Off localhost on purpose: the indexer mock only lets localhost through, so an
// unhandled indexer path fails loudly instead of reaching the devnet RPC.
const MOCK_INDEXER_URL = "http://casper-indexer.mock/";

export const scenarioCoinConfig: ReturnType<CasperCoinConfig> = {
  ...localCoinConfig,
  infra: {
    ...localCoinConfig.infra,
    API_CASPER_INDEXER: MOCK_INDEXER_URL,
  },
};

/**
 * `freshAddress` holds the tagged public key, not an account hash: `broadcast`
 * and `createNewTransaction` both call `PublicKey.fromHex` on it.
 */
export const makeAccount = ({
  publicKey,
  index,
}: {
  publicKey: string;
  index: number;
}): CasperAccount => {
  const id = `js:2:${casper.id}:${publicKey}:${DERIVATION_MODE}`;
  const { derivationMode, xpubOrAddress } = decodeAccountId(id);

  return {
    type: "Account",
    id,
    xpub: xpubOrAddress,
    subAccounts: [],
    seedIdentifier: xpubOrAddress,
    used: true,
    swapHistory: [],
    derivationMode,
    currency: casper,
    index: USER_DERIVATION_INDEX_OFFSET + index,
    nfts: [],
    freshAddress: xpubOrAddress,
    freshAddressPath: liveDerivationPath(index),
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
};

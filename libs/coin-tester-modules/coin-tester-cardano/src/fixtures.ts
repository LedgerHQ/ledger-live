import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { TokenCurrencyIdSchema } from "@ledgerhq/ledger-wallet-framework/types";
import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { CardanoInfra } from "@ledgerhq/coin-cardano/config";

export const CARDANO = getCryptoCurrencyById("cardano");
// Testnet currency (networkId 0, addr_test…) — used by the Yaci-devnet send scenario.
export const CARDANO_TESTNET = getCryptoCurrencyById("cardano_testnet");
export const FRESH_ADDRESS_PATH = "1852'/1815'/0'/0/0";

// Base URL the coin-cardano network layer is pointed at (via its coin config) and that MSW
// intercepts. Not a real host.
export const MOCK_API = "https://cardano-coin-tester.mock";

// coin-cardano endpoints of the mainnet (mock) scenarios, served by MSW.
export const MOCK_INFRA: CardanoInfra = {
  CARDANO_API_ENDPOINT: MOCK_API,
  CARDANO_EPOCH_PARAMS_ENDPOINT: "https://ada.api.live.ledger.com/api/rest/params",
};

// coin-cardano endpoints of the testnet (Yaci) scenarios. getValidators' epoch-params endpoint is a
// separate Ledger host; it points at the adapter too so the suite stays hermetic (served from a
// captured fixture).
export const MOCK_TESTNET_INFRA: CardanoInfra = {
  CARDANO_API_ENDPOINT: MOCK_API,
  CARDANO_EPOCH_PARAMS_ENDPOINT: `${MOCK_API}/epoch-params`,
};

// A Cardano native asset used by the token-send scenario. policyId is a 28-byte (56 hex) hash and
// assetName is hex ("4d59544f4b454e" = "MYTOKEN"). The canonical Cardano asset id is policyId
// concatenated with the asset name (no separator) — the same form getBalance emits as
// `assetReference` and craftTransaction's parseTokenAssetReference parses; contractAddress must match
// it (env.setup's mock store keys the token by contractAddress === that reference).
export const TEST_TOKEN_POLICY_ID = "1234567890123456789012345678901234567890123456789012345a";
export const TEST_TOKEN_ASSET_NAME = "4d59544f4b454e";
export const TEST_TOKEN: TokenCurrency = {
  type: "TokenCurrency",
  id: TokenCurrencyIdSchema.parse(`cardano/native/${TEST_TOKEN_POLICY_ID}${TEST_TOKEN_ASSET_NAME}`),
  contractAddress: `${TEST_TOKEN_POLICY_ID}${TEST_TOKEN_ASSET_NAME}`,
  parentCurrencyId: CARDANO.id,
  tokenType: "native",
  name: "Coin Tester Token",
  ticker: "CTT",
  units: [{ name: "Coin Tester Token", code: "CTT", magnitude: 0 }],
};

/** Minimal generic Account for the alpaca/generic-adapter sync to hydrate. */
export function makeAccount(address: string, currency: CryptoCurrency = CARDANO): Account {
  const id = `js:2:${currency.id}:${address}:`;
  const { derivationMode, xpubOrAddress } = decodeAccountId(id);

  return {
    type: "Account",
    id,
    xpub: xpubOrAddress,
    seedIdentifier: xpubOrAddress,
    derivationMode,
    index: 0,
    freshAddress: address,
    freshAddressPath: FRESH_ADDRESS_PATH,
    used: true,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    creationDate: new Date(0),
    blockHeight: 0,
    currency,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(0),
    subAccounts: [],
    swapHistory: [],
    nfts: [],
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
  };
}

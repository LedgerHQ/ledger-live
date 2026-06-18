import BigNumber from "bignumber.js";
import { ed25519 } from "@noble/curves/ed25519";
import { StrKey } from "@stellar/stellar-sdk";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import type { Account } from "@ledgerhq/types-live";

export const STELLAR = getCryptoCurrencyById("stellar");

/**
 * Stellar Quickstart serves Horizon on port 8000 by default.
 * Friendbot is mounted under /friendbot.
 */
export const HORIZON_URL = "http://127.0.0.1:8000";
export const FRIENDBOT_URL = `${HORIZON_URL}/friendbot`;

function addressFromSeed(seed: Uint8Array): string {
  return StrKey.encodeEd25519PublicKey(Buffer.from(ed25519.getPublicKey(seed)));
}

/**
 * Throw-away recipient address derived from a fixed seed so the test is
 * deterministic across runs while producing a checksum-valid G... address.
 * Stellar accounts must be created on-chain before they can receive payments,
 * so the scenario funds this address via Friendbot during setup.
 */
export const RECIPIENT_SEED = Uint8Array.from(
  Buffer.from("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "hex"),
);
export const RECIPIENT_ADDRESS = addressFromSeed(RECIPIENT_SEED);

/**
 * Issuer of the local USDC asset. Deterministic seed so the issuer address
 * is stable across runs and can be hard-coded in the mock crypto-assets store.
 *
 * NOTE: this is NOT Circle's mainnet USDC issuer
 * (`GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN`). Recreating
 * that exact issuer on a local sandbox would require Circle's secret key —
 * impossible. We instead control our own issuer here; the tokenId string
 * therefore embeds our local issuer's G... address rather than Circle's,
 * but the bridge code paths exercised are identical.
 */
export const ISSUER_SEED = Uint8Array.from(
  Buffer.from("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", "hex"),
);
export const ISSUER_ADDRESS = addressFromSeed(ISSUER_SEED);

/** Asset code under test. Stellar credit_alphanum4 (≤ 4 chars). */
export const USDC_ASSET_CODE = "USDC";

/**
 * USDC's on-chain magnitude on Stellar is 7 (stroop-style precision applies
 * to all Stellar assets, not only XLM), so the framework's BigNumber maths
 * lines up with the values Horizon reports.
 */
const USDC_ASSET_MAGNITUDE = 7;

export const USDC_TOKEN: TokenCurrency = {
  type: "TokenCurrency",
  id: `stellar/asset/${USDC_ASSET_CODE}:${ISSUER_ADDRESS}`,
  contractAddress: ISSUER_ADDRESS,
  parentCurrencyId: "stellar",
  tokenType: "stellar",
  name: USDC_ASSET_CODE,
  ticker: USDC_ASSET_CODE,
  delisted: false,
  disableCountervalue: false,
  units: [
    {
      name: USDC_ASSET_CODE,
      code: USDC_ASSET_CODE,
      magnitude: USDC_ASSET_MAGNITUDE,
    },
  ],
};

export function makeAccount(address: string): Account {
  const id = `js:2:stellar:${address}:sep5`;
  const { derivationMode, xpubOrAddress } = decodeAccountId(id);
  const scheme = getDerivationScheme({ derivationMode, currency: STELLAR });
  const index = 0;
  const freshAddressPath = runDerivationScheme(scheme, STELLAR, {
    account: index,
    node: 0,
    address: 0,
  });

  return {
    type: "Account",
    id,
    xpub: xpubOrAddress,
    subAccounts: [],
    seedIdentifier: xpubOrAddress,
    used: true,
    swapHistory: [],
    derivationMode,
    currency: STELLAR,
    index,
    nfts: [],
    freshAddress: xpubOrAddress,
    freshAddressPath,
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

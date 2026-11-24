import BigNumber from "bignumber.js";
import { fromEthAddress } from "iso-filecoin/address";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import {
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import type { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type { Account } from "@ledgerhq/types-live";
import { deriveAccount } from "./signer";

export const FILECOIN = getCryptoCurrencyById("filecoin");

/** A throwaway BIP-39 mnemonic: the keys behind it hold funds on the sandbox only. */
export const TEST_MNEMONIC = "test test test test test test test test test test test junk";

/** FIL airdropped to the account under test, whole units. */
export const FIL_AIRDROP = 100;
/** USDFC airdropped to the account under test, whole units. */
export const USDFC_AIRDROP = 100;

export const SEND_FIL = new BigNumber(10).pow(18);
export const SEND_USDFC = new BigNumber(10).times(new BigNumber(10).pow(18));

/** A secp256k1 `f1` account of the same mnemonic that nothing else uses. */
export const RECIPIENT_F1 = deriveAccount(TEST_MNEMONIC, "44'/461'/0'/0/1").address.toString();

/** Another one, still unknown to the chain when the send max runs. */
export const RECIPIENT_F1_FRESH = deriveAccount(
  TEST_MNEMONIC,
  "44'/461'/0'/0/2",
).address.toString();

/** An Ethereum-style address no genesis account uses. */
export const RECIPIENT_ETH = "0x1111111111111111111111111111111111111111";

/** Its delegated `f410` form, the recipient the node records for a send to it. */
export const RECIPIENT_ETH_F410 = fromEthAddress(RECIPIENT_ETH, "mainnet").toString();

export const USDFC: TokenCurrency = {
  type: "TokenCurrency",
  id: "filecoin/erc20/usdfc",
  contractAddress: "0x80b98d3aa09ffff255c3ba4a241111ff1262f045",
  parentCurrencyId: FILECOIN.id,
  tokenType: "erc20",
  name: "USDFC",
  ticker: "USDFC",
  delisted: false,
  disableCountervalue: false,
  units: [{ name: "USDFC", code: "USDFC", magnitude: 18 }],
} as TokenCurrency;

/** The legacy sync resolves each ERC-20 contract the indexer reports through this store. */
export function installTokenStore(): void {
  setCryptoAssetsStore({
    findTokenById: async (id: string) => (id === USDFC.id ? USDFC : undefined),
    findTokenByAddressInCurrency: async (address: string, currencyId: string) =>
      currencyId === FILECOIN.id && address.toLowerCase() === USDFC.contractAddress.toLowerCase()
        ? USDFC
        : undefined,
    getTokensSyncHash: async () => "",
  });
}

export function usdfcSubAccountId(accountId: string): string {
  return encodeTokenAccountId(accountId, USDFC);
}

export function makeFilecoinAccount(address: string, index: number): Account {
  const id = `js:2:filecoin:${address}:glif`;
  const derivationMode = "glif";
  const scheme = getDerivationScheme({ derivationMode, currency: FILECOIN });
  const freshAddressPath = runDerivationScheme(scheme, FILECOIN, { account: index });

  return {
    type: "Account",
    id,
    xpub: address,
    subAccounts: [],
    seedIdentifier: address,
    used: true,
    swapHistory: [],
    derivationMode,
    currency: FILECOIN,
    index,
    nfts: [],
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
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
  };
}

import { BigNumber } from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { ZcashAccount } from "@ledgerhq/coin-bitcoin/types";
import type { ZcashPrivateInfo } from "@ledgerhq/zcash-shielded/types";
import { DEFAULT_ZCASH_PRIVATE_INFO } from "@ledgerhq/zcash-shielded/constants";
import type { BalanceHistoryCache } from "@ledgerhq/types-live";

const EMPTY_BALANCE_HISTORY_CACHE: BalanceHistoryCache = {
  HOUR: { latestDate: null, balances: [] },
  DAY: { latestDate: null, balances: [] },
  WEEK: { latestDate: null, balances: [] },
};

export interface ZcashAccountStubOptions {
  ufvk: string;
  /** xpub for transparent sync resume. Dummy value is fine for shielded-only scenarios. */
  xpub: string;
  birthHeight?: number;
  /** Pass when restoring from snapshot */
  blockHeight?: number;
  network?: "mainnet" | "testnet";
}

/**
 * Creates a minimal ZcashAccount stub suitable for driving makeGetAccountShape().
 *
 * Key requirements:
 * - id encodes the xpub so generateXpubIfNeeded() does not call the signer
 * - privateInfo.ufvk is set so shielded sync is enabled
 * - blockHeight = birthHeight by default (sync resumes from birthHeight + 1)
 */
export function createZcashAccountStub(opts: ZcashAccountStubOptions): ZcashAccount {
  const currency = getCryptoCurrencyById("zcash");
  const derivationMode = "";

  const id = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: opts.xpub,
    derivationMode,
  });

  const privateInfo: ZcashPrivateInfo = {
    ...DEFAULT_ZCASH_PRIVATE_INFO,
    ufvk: opts.ufvk,
    syncState: "ready",
    birthday: opts.birthHeight?.toString() ?? null,
    lastBlockProcessed: opts.blockHeight ?? opts.birthHeight ?? null,
  };

  const blockHeight = opts.blockHeight ?? opts.birthHeight ?? 0;

  return {
    type: "Account" as const,
    id,
    seedIdentifier: opts.xpub,
    currency,
    derivationMode,
    index: 0,
    freshAddress: "",
    freshAddressPath: "44'/133'/0'/0/0",
    blockHeight,
    creationDate: new Date(),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(0),
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    used: false,
    swapHistory: [],
    balanceHistoryCache: EMPTY_BALANCE_HISTORY_CACHE,
    bitcoinResources: { utxos: [] },
    privateInfo,
  } as ZcashAccount;
}

/**
 * Accounts domain – fetch via Alpaca API only (no bridge.sync).
 * Used when isAlpacaForAccountId(accountId) is true (evm, xrp, stellar, tezos).
 * Fetches balance + lastBlock + token balances; no listOperations (see operationHistory/actions).
 */
import { decodeAccountId } from "@ledgerhq/live-common/account/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { encodeAccountId, getSyncHash } from "@ledgerhq/coin-framework/account/index";
// @ts-expect-error subpath may not resolve in web-tools tsconfig
import { getAlpacaApi } from "@ledgerhq/live-common/bridge/generic-alpaca/alpaca";
import { extractBalance } from "@ledgerhq/live-common/bridge/generic-alpaca/utils";
import { buildSubAccounts } from "@ledgerhq/live-common/bridge/generic-alpaca/buildSubAccounts";
import type { AccountV4, TokenAccountV4 } from "./schema";
import type { AccountCoinResources } from "../accountCoinResources/schema";
import { inferAccount } from "../../shared/compatibility";

export interface AlpacaAccountDataResult {
  accountV4: AccountV4;
  accountCoinResources: AccountCoinResources;
}

/**
 * Fetch account data only (balance + lastBlock + token balances). No listOperations.
 * Returns payload; no dispatch. Used by accounts/actions fetchAccountDataUpdates.
 */
export async function fetchAccountDataViaAlpaca(
  accountId: string,
): Promise<AlpacaAccountDataResult> {
  const { currencyId, xpubOrAddress: address, derivationMode } = decodeAccountId(accountId);
  const currency = getCryptoCurrencyById(currencyId);
  const alpacaApi = getAlpacaApi(currency.id, "local");

  const id = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  const [blockInfo, balanceRes] = await Promise.all([
    alpacaApi.lastBlock(),
    alpacaApi.getBalance(address),
  ]);

  const nativeAsset = extractBalance(balanceRes, "native");
  const allTokenAssetsBalances = balanceRes.filter(
    (b: { asset: { type: string } }) => b.asset.type !== "native",
  );
  const nativeBalance = BigInt(nativeAsset?.value ?? "0");
  const spendableBalance = BigInt(nativeBalance - BigInt(nativeAsset?.locked ?? "0"));

  const syncConfig = { blacklistedTokenIds: [] as string[], paginationConfig: {} };
  const subAccounts = await buildSubAccounts({
    accountId: id,
    allTokenAssetsBalances,
    syncConfig,
    operations: [],
    getTokenFromAsset: alpacaApi.getTokenFromAsset,
  });

  const initialAccount = inferAccount(accountId);
  const syncHash = await getSyncHash(currency.id, syncConfig.blacklistedTokenIds);
  const accountV4: AccountV4 = {
    type: "Account",
    id,
    derivationMode: initialAccount.derivationMode,
    index: initialAccount.index,
    freshAddress: address,
    freshAddressPath: initialAccount.freshAddressPath,
    currencyId: currency.id,
    balance: nativeBalance.toString(),
    blockHeight: blockInfo?.height ?? 0,
    spendableBalance: spendableBalance.toString(),
    feesCurrencyId: initialAccount.feesCurrency?.id,
    subAccounts: subAccounts.map(
      (ta): TokenAccountV4 => ({
        type: "TokenAccount",
        id: ta.id,
        parentId: ta.parentId,
        tokenId: ta.token.id,
        balance: ta.balance.toString(),
        spendableBalance: ta.spendableBalance.toString(),
        creationDate:
          ta.creationDate instanceof Date ? ta.creationDate.getTime() : Number(ta.creationDate),
        operationsCount: ta.operationsCount,
      }),
    ),
    used: true,
    creationDate:
      initialAccount.creationDate instanceof Date
        ? initialAccount.creationDate.getTime()
        : Date.now(),
    operationsCount: 0,
    seedIdentifier: address,
    xpub: address,
    lastSyncDate: Date.now(),
    syncHash,
  };

  return {
    accountV4,
    accountCoinResources: {},
  };
}

import {
  emptyHistoryCache,
  encodeAccountId,
  encodeTokenAccountId,
} from "@ledgerhq/coin-framework/account/index";
import { GetAccountShape, makeSync } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { getAddressFromPublicKey } from "@stacks/transactions";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import {
  fetchAllTokenBalances,
  fetchBalances,
  fetchBlockHeight,
  fetchFullMempoolTxs,
  fetchFullTxs,
} from "../network/api";
import {
  mapPendingTxToOps,
  mapTxToOps,
  reconciliatePublicKey,
  sip010TxnToOperation,
} from "./utils/misc";
import { log } from "@ledgerhq/logs";
import { findTokenById } from "@ledgerhq/cryptoassets/tokens";
import { TransactionResponse } from "../network";

export const getAccountShape: GetAccountShape = async info => {
  const { initialAccount, currency, rest = {}, derivationMode } = info;
  // for bridge tests specifically the `rest` object is empty and therefore the publicKey is undefined
  // reconciliatePublicKey tries to get pubKey from rest object and then from accountId
  const pubKey = reconciliatePublicKey(rest.publicKey, initialAccount);
  invariant(pubKey, "publicKey is required");

  const accountId: string = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: pubKey,
    derivationMode,
  });

  const address = getAddressFromPublicKey(pubKey);

  const blockHeight = await fetchBlockHeight();
  const balanceResp = await fetchBalances(address);
  const [rawTxs, tokenTxs] = await fetchFullTxs(address);
  const tokenBalances = await fetchAllTokenBalances(address);
  const mempoolTxs = await fetchFullMempoolTxs(address);

  const balance = new BigNumber(balanceResp.balance);
  let spendableBalance = new BigNumber(balanceResp.balance);
  for (const tx of mempoolTxs) {
    spendableBalance = spendableBalance
      .minus(new BigNumber(tx.fee_rate))
      .minus(new BigNumber(tx.token_transfer.amount));
  }

  const pendingOperations = mempoolTxs.flatMap(mapPendingTxToOps(accountId, address));

  const tokenAccounts = await buildTokenAccounts(
    address,
    accountId,
    tokenTxs,
    tokenBalances,
    initialAccount,
  );

  const result: Partial<Account> = {
    id: accountId,
    subAccounts: tokenAccounts,
    xpub: pubKey,
    freshAddress: address,
    balance,
    spendableBalance,
    operations: pendingOperations.concat(rawTxs.flatMap(mapTxToOps(accountId, address))),
    blockHeight: blockHeight.chain_tip.block_height,
  };

  return result;
};

export async function buildTokenAccounts(
  address: string,
  parentAccountId: string,
  tokenTxs: Record<string, TransactionResponse[]>,
  tokenBalances: Record<string, string>,
  initialAccount?: Account,
): Promise<TokenAccount[]> {
  try {
    const subs: TokenAccount[] = [];
    for (const [tokenId, txns] of Object.entries(tokenTxs)) {
      const token = findTokenById("stacks/sip010/" + tokenId);
      if (!tokenId || !token) {
        log("error", `stacks token not found, addr: ${tokenId}`);
        continue;
      }

      const balanceResult = tokenBalances[tokenId];
      const bnBalance = new BigNumber(balanceResult || "0");
      const tokenAccountId = encodeTokenAccountId(parentAccountId, token);

      const operations = txns
        .flatMap(txn => sip010TxnToOperation(txn, address, tokenAccountId))
        .flat()
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      if (operations.length === 0 && bnBalance.isZero()) {
        continue;
      }

      const maybeExistingSubAccount =
        initialAccount &&
        initialAccount.subAccounts &&
        initialAccount.subAccounts.find(a => a.id === tokenAccountId);

      const sub: TokenAccount = {
        type: "TokenAccount",
        id: tokenAccountId,
        parentId: parentAccountId,
        token,
        balance: bnBalance,
        spendableBalance: bnBalance,
        operationsCount: operations.length,
        operations,
        pendingOperations: maybeExistingSubAccount ? maybeExistingSubAccount.pendingOperations : [],
        creationDate: operations.length > 0 ? operations[0].date : new Date(),
        swapHistory: maybeExistingSubAccount ? maybeExistingSubAccount.swapHistory : [],
        balanceHistoryCache: emptyHistoryCache, // calculated in the jsHelpers
      };

      subs.push(sub);
    }

    return subs;
  } catch (e) {
    log("error", "stacks error building token accounts", e);
    return [];
  }
}

export const sync = makeSync({ getAccountShape });

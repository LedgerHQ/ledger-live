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

/**
 * Calculates the spendable balance by subtracting pending transactions from the total balance
 */
export function calculateSpendableBalance(
  totalBalance: BigNumber,
  pendingTxs: Array<{ fee_rate: string; token_transfer: { amount: string } }>,
): BigNumber {
  let spendableBalance = totalBalance;
  
  for (const tx of pendingTxs) {
    spendableBalance = spendableBalance
      .minus(new BigNumber(tx.fee_rate))
      .minus(new BigNumber(tx.token_transfer.amount));
  }
  
  return spendableBalance;
}

/**
 * Creates a token account for a specific token
 */
export function createTokenAccount(
  address: string,
  parentAccountId: string,
  tokenId: string,
  tokenBalance: string, 
  transactionsList: TransactionResponse[],
  initialAccount?: Account
): TokenAccount | null {
  try {
    const token = findTokenById("stacks/sip010/" + tokenId);
    if (!tokenId || !token) {
      log("error", `stacks token not found, addr: ${tokenId}`);
      return null;
    }

    const bnBalance = new BigNumber(tokenBalance || "0");
    const tokenAccountId = encodeTokenAccountId(parentAccountId, token);

    // Process operations for this token
    const operations = transactionsList
      .flatMap(txn => sip010TxnToOperation(txn, address, tokenAccountId))
      .flat()
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    // Skip empty accounts with zero balance and no operations
    if (operations.length === 0 && bnBalance.isZero()) {
      return null;
    }

    // Preserve existing pending operations if available
    const maybeExistingSubAccount =
      initialAccount &&
      initialAccount.subAccounts &&
      initialAccount.subAccounts.find(a => a.id === tokenAccountId);

    const tokenAccount: TokenAccount = {
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

    return tokenAccount;
  } catch (e) {
    log("error", "stacks error creating token account", e);
    return null;
  }
}

/**
 * Builds token accounts for all tokens with transactions or balances
 */
export async function buildTokenAccounts(
  address: string,
  parentAccountId: string,
  tokenTxs: Record<string, TransactionResponse[]>,
  tokenBalances: Record<string, string>,
  initialAccount?: Account,
): Promise<TokenAccount[]> {
  try {
    const tokenAccounts: TokenAccount[] = [];
    
    // Process all tokens that have transactions
    for (const [tokenId, transactions] of Object.entries(tokenTxs)) {
      const balance = tokenBalances[tokenId] || "0";
      const tokenAccount = createTokenAccount(
        address, 
        parentAccountId, 
        tokenId, 
        balance, 
        transactions, 
        initialAccount
      );
      
      if (tokenAccount) {
        tokenAccounts.push(tokenAccount);
      }
    }
    
    // Process any tokens with balances but no transactions
    for (const [tokenId, balance] of Object.entries(tokenBalances)) {
      // Skip tokens we've already processed
      if (tokenTxs[tokenId]) continue;
      
      // Skip zero balances
      if (new BigNumber(balance).isZero()) continue;
      
      const tokenAccount = createTokenAccount(
        address, 
        parentAccountId, 
        tokenId, 
        balance, 
        [], // No transactions 
        initialAccount
      );
      
      if (tokenAccount) {
        tokenAccounts.push(tokenAccount);
      }
    }

    return tokenAccounts;
  } catch (e) {
    log("error", "stacks error building token accounts", e);
    return [];
  }
}

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

  // Make API calls in parallel for better performance
  const [
    blockHeight,
    balanceResp,
    txsResult,
    tokenBalances,
    mempoolTxs
  ] = await Promise.all([
    fetchBlockHeight(),
    fetchBalances(address),
    fetchFullTxs(address),
    fetchAllTokenBalances(address),
    fetchFullMempoolTxs(address)
  ]);

  const [rawTxs, tokenTxs] = txsResult;
  const balance = new BigNumber(balanceResp.balance);
  
  // Calculate spendable balance by considering pending transactions
  const spendableBalance = calculateSpendableBalance(balance, mempoolTxs);

  // Process pending operations
  const pendingOperations = mempoolTxs.flatMap(mapPendingTxToOps(accountId, address));

  // Process operations from confirmed transactions
  const operations = pendingOperations.concat(rawTxs.flatMap(mapTxToOps(accountId, address)));

  // Build token sub-accounts
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
    operations,
    blockHeight: blockHeight.chain_tip.block_height,
  };

  return result;
};

export const sync = makeSync({ getAccountShape });

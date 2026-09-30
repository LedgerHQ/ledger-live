import type { Stake } from "@ledgerhq/coin-module-framework/api/index";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import {
  emptyHistoryCache,
  encodeAccountId,
  encodeTokenAccountId,
} from "@ledgerhq/ledger-wallet-framework/account/index";
import { GetAccountShape, makeSync } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { log } from "@ledgerhq/logs";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { getAddressFromPublicKey } from "@stacks/transactions";
import BigNumber from "bignumber.js";
import invariant from "invariant";
import { getConfiguredStacksNetwork, validateAddress } from "../common-logic";
import { getStakes } from "../logic/getStakes";
import { TransactionResponse } from "../network";
import type { StacksAccount, StakingPosition } from "../types";
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
  sip010OpToParentOp,
} from "./utils/misc";

function toStakingPositionOnAccount(stake: Stake): StakingPosition {
  const { amount, amountDeposited, amountRewarded, ...rest } = stake;
  return {
    ...rest,
    amount: new BigNumber(amount.toString()),
    ...(amountDeposited !== undefined && {
      amountDeposited: new BigNumber(amountDeposited.toString()),
    }),
    ...(amountRewarded !== undefined && {
      amountRewarded: new BigNumber(amountRewarded.toString()),
    }),
  };
}

/**
 * Calculates the spendable balance by subtracting pending transactions from the total balance
 */
export function calculateSpendableBalance(
  totalBalance: BigNumber,
  pendingTxs: Array<{ tx_type: string; fee_rate: string; token_transfer?: { amount: string } }>,
): BigNumber {
  let spendableBalance = totalBalance;

  for (const tx of pendingTxs) {
    spendableBalance = spendableBalance.minus(new BigNumber(tx.fee_rate));
    // Only a native STX transfer moves STX beyond the fee — a pending contract-call (e.g. a
    // SIP-010 transfer) has no `token_transfer` field at all and doesn't move native STX itself.
    if (tx.tx_type === "token_transfer" && tx.token_transfer) {
      spendableBalance = spendableBalance.minus(new BigNumber(tx.token_transfer.amount));
    }
  }

  return spendableBalance;
}

/**
 * Creates a token account for a specific token
 */
export async function createTokenAccount(
  address: string,
  parentAccountId: string,
  tokenId: string,
  tokenBalance: string,
  transactionsList: TransactionResponse[],
  initialAccount?: Account,
): Promise<TokenAccount | null> {
  try {
    const token = await getCryptoAssetsStore().findTokenByAddressInCurrency(tokenId, "stacks");

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
    const maybeExistingSubAccount = initialAccount?.subAccounts?.find(a => a.id === tokenAccountId);

    const tokenAccount: TokenAccount = {
      type: "TokenAccount",
      id: tokenAccountId,
      parentId: parentAccountId,
      token,
      balance: bnBalance,
      spendableBalance: bnBalance,
      operationsCount: operations.length,
      operations,
      pendingOperations: maybeExistingSubAccount?.pendingOperations ?? [],
      creationDate: operations.length > 0 ? operations[operations.length - 1].date : new Date(),
      swapHistory: maybeExistingSubAccount?.swapHistory ?? [],
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
      const tokenAccount = await createTokenAccount(
        address,
        parentAccountId,
        tokenId,
        balance,
        transactions,
        initialAccount,
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

      const tokenAccount = await createTokenAccount(
        address,
        parentAccountId,
        tokenId,
        balance,
        [], // No transactions
        initialAccount,
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

export const getAccountShape: GetAccountShape<StacksAccount> = async info => {
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

  // `pubKey` is not always a real public key: `reconciliatePublicKey`'s fallback (no live
  // `rest.publicKey`, e.g. a background resync) returns whatever was already encoded as
  // `xpubOrAddress` in the account's own id -- which, for an account whose id was ever minted
  // under that same fallback, is the account's c32 address, not a hex key. `getAddressFromPublicKey`
  // assumes a hex string and hexToBytes()-decodes it unconditionally, so feeding it a c32 address
  // throws ("Invalid byte sequence") and fails the whole sync. Detect and pass an already-valid
  // address straight through instead of trying to re-derive it.
  //
  // Additive only: the legacy bridge has only ever registered the mainnet "stacks" currency, so
  // this always defaulted to Mainnet with no way to override it. `API_STACKS_NETWORK` lets a
  // devnet/testnet consumer (e.g. the coin-tester) derive the correctly-versioned address instead
  // of a mainnet one that was never funded on that chain. v7's `getAddressFromPublicKey` takes the
  // network name directly (no more `TransactionVersion` enum), so this env var's value passes
  // straight through.
  const address = validateAddress(pubKey).isValid
    ? pubKey
    : getAddressFromPublicKey(pubKey, getConfiguredStacksNetwork());

  // Make API calls in parallel for better performance
  const [blockHeight, balanceResp, txsResult, tokenBalances, mempoolTxs, stakes] =
    await Promise.all([
      fetchBlockHeight(),
      fetchBalances(address),
      fetchFullTxs(address),
      fetchAllTokenBalances(address),
      fetchFullMempoolTxs(address),
      getStakes(address)
        .then(page => page.items)
        .catch(e => {
          // A failed stake lookup must not fail the whole account sync, but it also must not be
          // reported as "no active stake": jsHelpers merges `{ ...initialAccount, ...shape }`
          // (same convention as the generic-coin-framework's own getAccountShape.ts), so including
          // `stakingPositions: []` here would clobber a real, previously-known position on a
          // transient `/v2/pox` failure -- hiding it and wrongly re-exposing the Stake action even
          // though pox-5 would still reject a new stake with ERR_ALREADY_STAKED. `undefined` here
          // (as opposed to `[]`) signals the caller to omit the key entirely instead.
          log("error", "stacks error fetching stakes", e);
          return undefined;
        }),
    ]);

  const [rawTxs, tokenTxs] = txsResult;
  const balance = new BigNumber(balanceResp.balance);

  // `balanceResp.locked` (the staked/locked amount) is not spendable -- same treatment as
  // getBalance.ts and buildUnsignedTx.ts's `balance.value - balance.locked`. Subtract it before
  // accounting for pending transactions.
  const lockedBalance = new BigNumber(balanceResp.locked || "0");
  const spendableBalance = calculateSpendableBalance(balance.minus(lockedBalance), mempoolTxs);

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

  const result: Partial<StacksAccount> = {
    id: accountId,
    subAccounts: tokenAccounts,
    xpub: pubKey,
    freshAddress: address,
    balance,
    spendableBalance,
    // merge operations from both token and account
    operations: [
      ...operations,
      ...tokenAccounts.flatMap(t => sip010OpToParentOp(t.operations, accountId)),
    ].sort((a, b) => b.date.getTime() - a.date.getTime()),
    blockHeight: blockHeight.chain_tip.block_height,
    // Key omitted (not set to `[]`) when the lookup failed -- see the `.catch` above: jsHelpers'
    // `{ ...initialAccount, ...shape }` merge must fall through to the account's last-known value
    // instead of being handed an empty, authoritative-looking overwrite.
    ...(stakes !== undefined ? { stakingPositions: stakes.map(toStakingPositionOnAccount) } : {}),
  };

  return result;
};

export const sync = makeSync({ getAccountShape });

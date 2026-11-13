import {
  encodeTokenAccountId,
  emptyHistoryCache,
} from "@ledgerhq/ledger-wallet-framework/account/index";
import { mergeOps } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { TokenCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type { TokenAccount } from "@ledgerhq/types-live";
import { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { type TransferProposal } from "../network/gateway";

export type CantonTokenAccount = TokenAccount & {
  cantonResources: { pendingTransferProposals: TransferProposal[] };
};

const isOperationOf = (instrumentId: string, adminId: string) => (op: Operation) => {
  const extra = op.extra as { instrumentId?: string; instrumentAdmin?: string };
  return extra?.instrumentId === instrumentId && extra?.instrumentAdmin === adminId;
};

export function buildSubAccounts({
  accountId,
  tokenBalances,
  existingSubAccounts,
  allOperations,
  pendingTransferProposals,
  calTokens,
}: {
  accountId: string;
  calTokens: Map<string, string>;
  tokenBalances: Array<{
    adminId: string;
    totalBalance: bigint;
    spendableBalance: bigint;
    token: TokenCurrency;
  }>;
  existingSubAccounts: TokenAccount[];
  allOperations: Operation[];
  pendingTransferProposals: TransferProposal[];
}): CantonTokenAccount[] {
  if (tokenBalances.length === 0) return [];

  const tokenAccounts: CantonTokenAccount[] = [];
  const existingAccountByTicker: { [ticker: string]: TokenAccount } = {};
  const existingAccountTickers: string[] = [];
  const savedOperationsByTicker: { [ticker: string]: Operation[] } = {};

  for (const existingSubAccount of existingSubAccounts) {
    if (existingSubAccount.type === "TokenAccount") {
      const { ticker } = existingSubAccount.token;
      existingAccountTickers.push(ticker);
      // The first one: sync regenerates a chart only if it still is the first saved sub-account's.
      existingAccountByTicker[ticker] ??= existingSubAccount;
      savedOperationsByTicker[ticker] = [
        ...(savedOperationsByTicker[ticker] ?? []),
        ...existingSubAccount.operations,
      ];
    }
  }

  for (const { totalBalance, spendableBalance, token, adminId } of tokenBalances) {
    const initialTokenAccount = existingAccountByTicker[token.ticker];

    const instrumentId = calTokens.get(token.id) || token.name;

    const isOwnOperation = isOperationOf(instrumentId, adminId);

    // Filter pending transfer proposals for this specific instrument
    const tokenPendingTransferProposals = pendingTransferProposals.filter(
      proposal => proposal.instrument_id === instrumentId && proposal.instrument_admin === adminId,
    );

    const tokenAccount = buildSubAccount({
      totalBalance: new BigNumber(totalBalance.toString()),
      spendableBalance: new BigNumber(spendableBalance.toString()),
      accountId,
      initialTokenAccount,
      parentAccountId: accountId,
      token,
      operations: allOperations.filter(isOwnOperation),
      // Saved before sync matched admins, one ticker can have several sub-accounts mixing admins.
      previousOperations: mergeOps(
        [],
        (savedOperationsByTicker[token.ticker] ?? []).filter(isOwnOperation),
      ),
      pendingTransferProposals: tokenPendingTransferProposals,
    });
    if (tokenAccount) tokenAccounts.push(tokenAccount);
  }

  return tokenAccounts;
}

function buildSubAccount({
  totalBalance,
  spendableBalance,
  accountId,
  initialTokenAccount,
  parentAccountId,
  token,
  operations,
  previousOperations,
  pendingTransferProposals,
}: {
  totalBalance: BigNumber;
  spendableBalance: BigNumber;
  accountId: string;
  initialTokenAccount: TokenAccount | undefined;
  parentAccountId: string;
  token: TokenCurrency;
  operations: Operation[];
  previousOperations: Operation[];
  pendingTransferProposals: TransferProposal[];
}): CantonTokenAccount {
  const subAccountId = encodeTokenAccountId(accountId, token);

  // Merge old operations with new ones and update accountId for sub-account
  const newOperations = operations.map(op => ({
    ...op,
    id: encodeOperationId(subAccountId, op.hash, op.type),
    accountId: subAccountId,
  }));
  const mergedOperations = mergeOps(previousOperations, newOperations);

  const creationDate =
    mergedOperations.length > 0
      ? new Date(Math.min(...mergedOperations.map(op => op.date.getTime())))
      : new Date();

  return {
    type: "TokenAccount" as const,
    id: subAccountId,
    parentId: parentAccountId,
    token,
    balance: totalBalance,
    spendableBalance,
    operationsCount: mergedOperations.length,
    operations: mergedOperations,
    creationDate,
    pendingOperations: initialTokenAccount?.pendingOperations || [],
    balanceHistoryCache: initialTokenAccount?.balanceHistoryCache || emptyHistoryCache,
    swapHistory: [],
    cantonResources: {
      pendingTransferProposals,
    },
  };
}

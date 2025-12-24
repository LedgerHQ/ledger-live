import BigNumber from "bignumber.js";
import { Operation } from "@ledgerhq/types-live";
import type { TokenAccount } from "@ledgerhq/types-live";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { encodeTokenAccountId, emptyHistoryCache } from "@ledgerhq/coin-framework/account/index";
import { mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { type TransferProposal } from "../types/gateway";

export type CantonTokenAccount = TokenAccount & {
  cantonResources: { pendingTransferProposals: TransferProposal[] };
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

  for (const existingSubAccount of existingSubAccounts) {
    if (existingSubAccount.type === "TokenAccount") {
      const { ticker } = existingSubAccount.token;
      existingAccountTickers.push(ticker);
      existingAccountByTicker[ticker] = existingSubAccount;
    }
  }

  for (const { totalBalance, spendableBalance, token, adminId } of tokenBalances) {
    const initialTokenAccount = existingAccountByTicker[token.ticker];

    const instrumentId = calTokens.get(token.id) || token.name;

    // Filter operations for this specific instrument (both id and admin must match)
    const tokenOperations = allOperations.filter(op => {
      const extra = op.extra as { instrumentId?: string; instrumentAdmin?: string };
      return extra?.instrumentId === instrumentId && extra?.instrumentAdmin === adminId;
    });

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
      operations: tokenOperations,
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
  pendingTransferProposals,
}: {
  totalBalance: BigNumber;
  spendableBalance: BigNumber;
  accountId: string;
  initialTokenAccount: TokenAccount | undefined;
  parentAccountId: string;
  token: TokenCurrency;
  operations: Operation[];
  pendingTransferProposals: TransferProposal[];
}): CantonTokenAccount {
  const subAccountId = encodeTokenAccountId(accountId, token);

  // Merge old operations with new ones and update accountId for sub-account
  const oldOperations = initialTokenAccount?.operations || [];
  const newOperations = operations.map(op => ({
    ...op,
    id: encodeOperationId(subAccountId, op.hash, op.type),
    accountId: subAccountId,
  }));
  const mergedOperations = mergeOps(oldOperations, newOperations);

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

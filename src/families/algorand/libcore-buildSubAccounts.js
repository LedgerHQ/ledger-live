// @flow

import type {
  CryptoCurrency,
  TokenAccount,
  Account,
  SyncConfig,
} from "../../types";
import type { CoreAccount } from "../../libcore/types";
import { minimalOperationsBuilder } from "../../reconciliation";
import { buildASAOperation } from "./buildASAOperation";
import { BigNumber } from "bignumber.js";
import { findTokenById, listTokensForCryptoCurrency } from "../../currencies";
import { emptyHistoryCache } from "../../account";
import { promiseAllBatched } from "../../promise";
import { extractTokenId, addPrefixToken } from "./tokens";

const OperationOrderKey = {
  date: 0,
};

async function buildAlgorandTokenAccount({
  parentAccountId,
  token,
  coreAccount,
  existingTokenAccount,
  balance,
}) {
  const extractedId = extractTokenId(token.id);
  const id = parentAccountId + "+" + extractedId;
  const getAllOperations = async () => {
    const query = await coreAccount.queryOperations();
    await query.complete();
    await query.addOrder(OperationOrderKey.date, false);
    const coreOperations = await query.execute();

    const operations = await minimalOperationsBuilder(
      (existingTokenAccount && existingTokenAccount.operations) || [],
      coreOperations,
      (coreOperation) =>
        buildASAOperation({
          coreOperation,
          accountId: id,
          tokenId: extractedId,
        })
    );
    return operations;
  };

  const operations = await getAllOperations();

  const tokenAccount: $Exact<TokenAccount> = {
    type: "TokenAccount",
    id,
    parentId: parentAccountId,
    starred: false,
    token,
    operationsCount: operations.length,
    operations,
    pendingOperations: [],
    balance,
    spendableBalance: balance,
    swapHistory: [],
    creationDate:
      operations.length > 0
        ? operations[operations.length - 1].date
        : new Date(),
    balanceHistoryCache: emptyHistoryCache, // calculated in the jsHelpers
  };

  return tokenAccount;
}

async function algorandBuildTokenAccounts({
  currency,
  coreAccount,
  accountId,
  existingAccount,
  syncConfig,
}: {
  currency: CryptoCurrency,
  coreAccount: CoreAccount,
  accountId: string,
  existingAccount: ?Account,
  syncConfig: SyncConfig,
}): Promise<?(TokenAccount[])> {
  const { blacklistedTokenIds = [] } = syncConfig;
  if (listTokensForCryptoCurrency(currency).length === 0) return undefined;
  const tokenAccounts = [];
  const algorandAccount = await coreAccount.asAlgorandAccount();
  const accountASA = await algorandAccount.getAssetsBalances();

  const existingAccountByTicker = {}; // used for fast lookup
  const existingAccountTickers = []; // used to keep track of ordering
  if (existingAccount && existingAccount.subAccounts) {
    for (const existingSubAccount of existingAccount.subAccounts) {
      if (existingSubAccount.type === "TokenAccount") {
        const { ticker, id } = existingSubAccount.token;
        if (!blacklistedTokenIds.includes(id)) {
          existingAccountTickers.push(ticker);
          existingAccountByTicker[ticker] = existingSubAccount;
        }
      }
    }
  }

  // filter by token existence
  await promiseAllBatched(3, accountASA, async (asa) => {
    const token = findTokenById(addPrefixToken(await asa.getAssetId()));
    if (token && !blacklistedTokenIds.includes(token.id)) {
      const existingTokenAccount = existingAccountByTicker[token.ticker];
      const tokenAccount = await buildAlgorandTokenAccount({
        parentAccountId: accountId,
        existingTokenAccount,
        token,
        coreAccount,
        balance: BigNumber(await asa.getAmount()),
      });

      if (tokenAccount) tokenAccounts.push(tokenAccount);
    }
  });

  // Preserve order of tokenAccounts from the existing token accounts
  tokenAccounts.sort((a, b) => {
    const i = existingAccountTickers.indexOf(a.token.ticker);
    const j = existingAccountTickers.indexOf(b.token.ticker);
    if (i === j) return 0;
    if (i < 0) return 1;
    if (j < 0) return -1;
    return i - j;
  });

  return tokenAccounts;
}

export default algorandBuildTokenAccounts;

// @flow

import type {
  CryptoCurrency,
  TokenAccount,
  Account,
  SyncConfig,
} from "../../types";
import type { CoreAccount } from "../../libcore/types";
import type { CoreERC20LikeAccount } from "./types";
import { libcoreBigIntToBigNumber } from "../../libcore/buildBigNumber";
import { minimalOperationsBuilder } from "../../reconciliation";
import { buildERC20Operation } from "./buildERC20Operation";
import {
  findTokenByAddress,
  listTokensForCryptoCurrency,
} from "../../currencies";
import { promiseAllBatched } from "../../promise";

async function buildERC20TokenAccount({
  parentAccountId,
  token,
  coreTokenAccount,
  existingTokenAccount,
  balance,
}) {
  const coreOperations = await coreTokenAccount.getOperations();
  const id = parentAccountId + "+" + token.contractAddress;

  const operations = await minimalOperationsBuilder(
    (existingTokenAccount && existingTokenAccount.operations) || [],
    coreOperations,
    (coreOperation) =>
      buildERC20Operation({
        coreOperation,
        accountId: id,
        token,
      })
  );
  const swapHistory = existingTokenAccount?.swapHistory || [];
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
    creationDate:
      operations.length > 0
        ? operations[operations.length - 1].date
        : new Date(),
    swapHistory,
  };

  return tokenAccount;
}

async function getERC20Address(erc20LA: CoreERC20LikeAccount): Promise<string> {
  const token = await erc20LA.getToken();
  return await token.getContractAddress();
}

async function ethereumBuildTokenAccounts({
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
  const ethAccount = await coreAccount.asEthereumLikeAccount();
  const allCoreTAS = await ethAccount.getERC20Accounts();
  const allCoreTAContractAddresses = await promiseAllBatched(
    4,
    allCoreTAS,
    getERC20Address
  );

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

  const tokenAccountData = [];

  // filter by token existence
  for (const [index, coreTA] of allCoreTAS.entries()) {
    const contractAddress = allCoreTAContractAddresses[index];
    const token = findTokenByAddress(contractAddress);
    if (token && !blacklistedTokenIds.includes(token.id)) {
      tokenAccountData.push({
        token,
        coreTA,
        contractAddress,
      });
    }
  }

  // fetch balances for existing tokens
  const coreTAB = await ethAccount.getERC20Balances(
    tokenAccountData.map((d) => d.contractAddress)
  );

  for (const [index, { token, coreTA }] of tokenAccountData.entries()) {
    const contractBalance = await libcoreBigIntToBigNumber(coreTAB[index]);
    const existingTokenAccount = existingAccountByTicker[token.ticker];
    const tokenAccount = await buildERC20TokenAccount({
      parentAccountId: accountId,
      existingTokenAccount,
      token,
      coreTokenAccount: coreTA,
      balance: contractBalance,
    });
    if (tokenAccount) tokenAccounts.push(tokenAccount);
  }

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

export default ethereumBuildTokenAccounts;

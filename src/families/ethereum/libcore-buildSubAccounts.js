// @flow

import type { BigNumber } from "bignumber.js";
import type { CryptoCurrency, TokenAccount, Account } from "../../types";
import type { CoreAccount, CoreBigInt } from "../../libcore/types";
import type { CoreEthereumLikeAccount, CoreERC20LikeAccount } from "./types";
import { libcoreBigIntToBigNumber } from "../../libcore/buildBigNumber";
import { minimalOperationsBuilder } from "../../reconciliation";
import { buildERC20Operation } from "./buildERC20Operation";
import {
  findTokenByAddress,
  listTokensForCryptoCurrency
} from "../../currencies";

async function buildERC20TokenAccount({
  parentAccountId,
  token,
  coreTokenAccount,
  existingTokenAccount,
  balance
}) {
  const coreOperations = await coreTokenAccount.getOperations();
  const id = parentAccountId + "+" + token.contractAddress;

  const operations = await minimalOperationsBuilder(
    (existingTokenAccount && existingTokenAccount.operations) || [],
    coreOperations,
    coreOperation =>
      buildERC20Operation({
        coreOperation,
        accountId: id,
        token
      })
  );

  const tokenAccount: $Exact<TokenAccount> = {
    type: "TokenAccount",
    id,
    parentId: parentAccountId,
    starred: false,
    token,
    operationsCount: operations.length,
    operations,
    pendingOperations: [],
    balance
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
  existingAccount
}: {
  currency: CryptoCurrency,
  coreAccount: CoreAccount,
  accountId: string,
  existingAccount: ?Account
}): Promise<?(TokenAccount[])> {
  if (listTokensForCryptoCurrency(currency).length === 0) return undefined;
  const tokenAccounts = [];
  const ethAccount: CoreEthereumLikeAccount = await coreAccount.asEthereumLikeAccount();
  const coreTAS: CoreERC20LikeAccount[] = await ethAccount.getERC20Accounts();

  const existingAccountByTicker = {}; // used for fast lookup
  const existingAccountTickers = []; // used to keep track of ordering
  if (existingAccount && existingAccount.subAccounts) {
    for (const existingSubAccount of existingAccount.subAccounts) {
      if (existingSubAccount.type === "TokenAccount") {
        const { ticker } = existingSubAccount.token;
        existingAccountTickers.push(ticker);
        existingAccountByTicker[ticker] = existingSubAccount;
      }
    }
  }

  const coreTAContractAddresses = await Promise.all(
    coreTAS.map(getERC20Address)
  );

  const coreTAB: CoreBigInt[] = await ethAccount.getERC20Balances(
    coreTAContractAddresses
  );

  for (const [index, coreTA] of coreTAS.entries()) {
    const contractAddress: string = coreTAContractAddresses[index];
    const contractBalance: BigNumber = await libcoreBigIntToBigNumber(
      coreTAB[index]
    );
    const token = findTokenByAddress(contractAddress);
    if (token) {
      const existingTokenAccount = existingAccountByTicker[token.ticker];
      const tokenAccount = await buildERC20TokenAccount({
        parentAccountId: accountId,
        existingTokenAccount,
        token,
        coreTokenAccount: coreTA,
        balance: contractBalance
      });
      if (tokenAccount) tokenAccounts.push(tokenAccount);
    }
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

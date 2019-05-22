// @flow

import type { TokenAccount, Account } from "../../types";
import type { CoreAccount } from "../../libcore/types";
import type { CoreEthereumLikeAccount, CoreERC20LikeAccount } from "./types";
import { libcoreBigIntToBigNumber } from "../../libcore/buildBigNumber";
import { minimalOperationsBuilder } from "../../reconciliation";
import { buildERC20Operation } from "./buildERC20Operation";
import { findTokenByAddress } from "../../currencies";

async function buildERC20TokenAccount({
  parentAccountId,
  token,
  coreTokenAccount,
  existingTokenAccount
}) {
  const balance = await libcoreBigIntToBigNumber(
    await coreTokenAccount.getBalance()
  );
  const coreOperations = await coreTokenAccount.getOperations();
  const id = parentAccountId + "|" + token.id;

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

  // TODO keep reference if no operation have changed, nor id/token/balance
  const tokenAccount: $Exact<TokenAccount> = {
    id,
    token,
    operations,
    balance
  };

  return tokenAccount;
}

async function ethereumBuildTokenAccounts({
  coreAccount,
  accountId,
  existingAccount
}: {
  coreAccount: CoreAccount,
  accountId: string,
  existingAccount: ?Account
}): Promise<?(TokenAccount[])> {
  const tokenAccounts = [];
  const ethAccount: CoreEthereumLikeAccount = await coreAccount.asEthereumLikeAccount();
  const coreTAS: CoreERC20LikeAccount[] = await ethAccount.getERC20Accounts();

  const existingAccountByTicker = {}; // used for fast lookup
  const existingAccountTickers = []; // used to keep track of ordering
  if (existingAccount && existingAccount.tokenAccounts) {
    for (const existingTokenAccount of existingAccount.tokenAccounts) {
      const { ticker } = existingTokenAccount.token;
      existingAccountTickers.push(ticker);
      existingAccountByTicker[ticker] = existingTokenAccount;
    }
  }

  for (const coreTA of coreTAS) {
    const coreToken = await coreTA.getToken();
    const contractAddress = await coreToken.getContractAddress();
    const token = findTokenByAddress(contractAddress);
    if (token) {
      const existingTokenAccount = existingAccountByTicker[token.ticker];
      const tokenAccount = await buildERC20TokenAccount({
        parentAccountId: accountId,
        existingTokenAccount,
        token,
        coreTokenAccount: coreTA
      });
      tokenAccounts.push(tokenAccount);
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

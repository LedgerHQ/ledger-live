// @flow

import type { TokenAccount, Account } from "../../types";
import type {
  CoreAccount,
  CoreEthereumLikeAccount,
  CoreERC20LikeAccount
} from "../../libcore/types";
import { libcoreBigIntToBigNumber } from "../../libcore/buildBigNumber";
import { minimalOperationsBuilder } from "../../libcore/reconciliation";
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
  for (const coreTA of coreTAS) {
    const coreToken = await coreTA.getToken();
    const contractAddress = await coreToken.getContractAddress();
    const token = findTokenByAddress(contractAddress);
    if (token) {
      const existingTokenAccount =
        existingAccount &&
        existingAccount.tokenAccounts &&
        existingAccount.tokenAccounts.find(a => a.token === token);
      const tokenAccount = await buildERC20TokenAccount({
        parentAccountId: accountId,
        existingTokenAccount,
        token,
        coreTokenAccount: coreTA
      });
      tokenAccounts.push(tokenAccount);
    }
  }
  return tokenAccounts;
}

export default ethereumBuildTokenAccounts;

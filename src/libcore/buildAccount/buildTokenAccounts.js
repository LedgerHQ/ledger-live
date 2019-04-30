// @flow

import type { TokenAccount, Account, CryptoCurrency } from "../../types";
import { libcoreBigIntToBigNumber } from "../buildBigNumber";
import type {
  CoreAccount,
  CoreEthereumLikeAccount,
  CoreERC20LikeAccount
} from "../types";
import { minimalOperationsBuilder } from "../reconciliation";
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

export async function ethereum({
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

const byFamily = {
  ethereum
};

export async function buildTokenAccounts(arg: {
  currency: CryptoCurrency,
  coreAccount: CoreAccount,
  accountId: string,
  existingAccount: ?Account
}): Promise<?(TokenAccount[])> {
  const f = byFamily[arg.currency.family];
  if (f) {
    const res = await f(arg);
    return res;
  }
}

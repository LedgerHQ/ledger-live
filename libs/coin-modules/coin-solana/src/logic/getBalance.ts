import type { Balance } from "@ledgerhq/coin-framework/api/index";
import type { ChainAPI } from "../network";
import { PARSED_PROGRAMS } from "../network/chain/program/constants";
import type { SolanaTokenProgram } from "../types";

export async function getBalance(api: ChainAPI, address: string): Promise<Balance[]> {
  const [balanceLamports, rentExemptMin, splTokenAccounts, token2022Accounts] = await Promise.all([
    api.getBalance(address),
    api.getMinimumBalanceForRentExemption(0),
    api.getParsedTokenAccountsByOwner(address).then(r => r.value),
    api.getParsedToken2022AccountsByOwner(address).then(r => r.value),
  ]);

  const nativeBalance: Balance = {
    value: BigInt(balanceLamports),
    asset: { type: "native" },
    locked: BigInt(rentExemptMin),
  };

  const splBalances = mapTokenAccountsToBalances(splTokenAccounts, PARSED_PROGRAMS.SPL_TOKEN);
  const token2022Balances = mapTokenAccountsToBalances(
    token2022Accounts,
    PARSED_PROGRAMS.SPL_TOKEN_2022,
  );

  return [nativeBalance, ...splBalances, ...token2022Balances];
}

function mapTokenAccountsToBalances(
  accounts: ReadonlyArray<{
    account: { data: { parsed: { info: { mint: string; tokenAmount: { amount: string } } } } };
  }>,
  tokenProgram: SolanaTokenProgram,
): Balance[] {
  return accounts.map(({ account }) => ({
    value: BigInt(account.data.parsed.info.tokenAmount.amount),
    asset: {
      type: tokenProgram,
      assetReference: account.data.parsed.info.mint,
    },
  }));
}

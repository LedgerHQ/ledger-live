import type { Balance } from "@ledgerhq/coin-framework/api/index";
import type { ChainAPI } from "../network";
import { PARSED_PROGRAMS } from "../network/chain/program/constants";
import type { ParsedOnChainTokenAccount } from "../network/chain/web3";
import type { SolanaTokenProgram } from "../types";

export async function getBalance(
  api: ChainAPI,
  address: string,
  options?: { token2022Enabled?: boolean },
): Promise<Balance[]> {
  const token2022Enabled = options?.token2022Enabled ?? false;

  const [balanceLamports, rentExemptMin, splTokenAccounts, token2022Accounts] = await Promise.all([
    api.getBalance(address),
    api.getMinimumBalanceForRentExemption(0),
    api.getParsedTokenAccountsByOwner(address).then(r => r.value),
    token2022Enabled
      ? api.getParsedToken2022AccountsByOwner(address).then(r => r.value)
      : Promise.resolve([]),
  ]);

  const balanceLamportBigInt = BigInt(balanceLamports);
  const rentExemptMinBigInt = BigInt(rentExemptMin);
  const lockedLamports =
    balanceLamportBigInt < rentExemptMinBigInt ? balanceLamportBigInt : rentExemptMinBigInt;

  const nativeBalance: Balance = {
    value: balanceLamportBigInt,
    asset: { type: "native" },
    locked: lockedLamports,
  };

  const splBalances = mapTokenAccountsToBalances(splTokenAccounts, PARSED_PROGRAMS.SPL_TOKEN);
  const token2022Balances = mapTokenAccountsToBalances(
    token2022Accounts,
    PARSED_PROGRAMS.SPL_TOKEN_2022,
  );

  return [nativeBalance, ...splBalances, ...token2022Balances];
}

function mapTokenAccountsToBalances(
  accounts: ReadonlyArray<ParsedOnChainTokenAccount>,
  tokenProgram: SolanaTokenProgram,
): Balance[] {
  const balancesByMint = new Map<string, bigint>();

  for (const { account } of accounts) {
    const { mint, tokenAmount } = account.data.parsed.info;
    const amount = BigInt(tokenAmount.amount);
    balancesByMint.set(mint, (balancesByMint.get(mint) ?? 0n) + amount);
  }

  return Array.from(balancesByMint.entries()).map(([mint, value]) => ({
    value,
    asset: {
      type: tokenProgram,
      assetReference: mint,
    },
  }));
}

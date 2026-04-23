import type { Balance, Stake, StakeState } from "@ledgerhq/coin-module-framework/api/index";
import type { ChainAPI } from "../network";
import { PARSED_PROGRAMS } from "../network/chain/program/constants";
import type { ParsedOnChainTokenAccount } from "../network/chain/web3";
import type { SolanaTokenProgram } from "../types";
import { computeUnstakeReserve, getStakeAccounts, type StakeAccount } from "./getStakes";

export async function getBalance(
  api: ChainAPI,
  address: string,
  options?: { token2022Enabled?: boolean },
): Promise<Balance[]> {
  const token2022Enabled = options?.token2022Enabled ?? false;

  const [balanceLamports, rentExemptMin, splTokenAccounts, token2022Accounts, stakeAccounts] =
    await Promise.all([
      api.getBalance(address),
      api.getMinimumBalanceForRentExemption(0),
      api.getParsedTokenAccountsByOwner(address).then(r => r.value),
      token2022Enabled
        ? api.getParsedToken2022AccountsByOwner(address).then(r => r.value)
        : Promise.resolve([]),
      getStakeAccounts(api, address),
    ]);

  const stakedLamports = stakeAccounts.reduce(
    (sum, sa) => sum + BigInt(sa.account.onChainAcc.account.lamports),
    0n,
  );

  const unstakeReserve = await computeUnstakeReserve(api, address, stakeAccounts);

  const balanceLamportBigInt = BigInt(balanceLamports);
  const totalBalance = balanceLamportBigInt + stakedLamports;
  const rentExemptMinBigInt = BigInt(rentExemptMin);
  const lockedLamports =
    balanceLamportBigInt < rentExemptMinBigInt ? balanceLamportBigInt : rentExemptMinBigInt;

  const rawLocked = lockedLamports + stakedLamports + BigInt(unstakeReserve);
  const nativeBalance: Balance = {
    value: totalBalance,
    asset: { type: "native" },
    locked: rawLocked > totalBalance ? totalBalance : rawLocked,
  };

  const stakeBalances = mapStakeAccountsToBalances(stakeAccounts);

  const splBalances = mapTokenAccountsToBalances(
    splTokenAccounts,
    PARSED_PROGRAMS.SPL_TOKEN,
    address,
  );
  const token2022Balances = mapTokenAccountsToBalances(
    token2022Accounts,
    PARSED_PROGRAMS.SPL_TOKEN_2022,
    address,
  );

  return [nativeBalance, ...stakeBalances, ...splBalances, ...token2022Balances];
}

function mapStakeAccountsToBalances(stakeAccounts: StakeAccount[]): Balance[] {
  return stakeAccounts.map(({ account, activation }) => {
    const delegation = account.info.stake?.delegation;
    const delegateAddress = delegation?.voter.toBase58();
    const amount = BigInt(account.onChainAcc.account.lamports);

    const stake: Stake = {
      uid: account.onChainAcc.pubkey.toBase58(),
      address: account.onChainAcc.pubkey.toBase58(),
      state: activation.state as StakeState,
      asset: { type: "native" },
      amount,
    };

    if (delegateAddress) {
      stake.delegate = delegateAddress;
    }
    if (delegation) {
      const deposited = BigInt(delegation.stake.toString());
      stake.amountDeposited = deposited;
      stake.amountRewarded = amount > deposited ? amount - deposited : 0n;
    }

    return {
      value: amount,
      asset: { type: "native" as const },
      stake,
    };
  });
}

function mapTokenAccountsToBalances(
  accounts: ReadonlyArray<ParsedOnChainTokenAccount>,
  tokenProgram: SolanaTokenProgram,
  ownerAddress: string,
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
      assetOwner: ownerAddress,
    },
  }));
}

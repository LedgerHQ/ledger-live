import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import type { Balance } from "@ledgerhq/coin-module-framework/api/index";
import type { ChainAPI } from "../network";
import { PARSED_PROGRAMS } from "../network/chain/program/constants";
import type { ParsedOnChainTokenAccount } from "../network/chain/web3";
import { getTokenAccountProgramId } from "../helpers/token";
import type { SolanaTokenProgram } from "../types";
import {
  computeUnstakeReserve,
  getStakeAccounts,
  mapStakeAccountToFrameworkStake,
  type StakeAccount,
} from "./getStakes";

export async function getBalance(
  api: ChainAPI,
  address: string,
  options?: { token2022Enabled?: boolean },
): Promise<Balance[]> {
  const token2022Enabled = options?.token2022Enabled ?? false;

  const [
    balanceLamports,
    rentExemptMin,
    splTokenAccounts,
    token2022Accounts,
    stakeAccounts,
    { epoch },
  ] = await Promise.all([
    api.getBalance(address),
    api.getMinimumBalanceForRentExemption(0),
    api.getParsedTokenAccountsByOwner(address).then(r => r.value),
    token2022Enabled
      ? api.getParsedToken2022AccountsByOwner(address).then(r => r.value)
      : Promise.resolve([]),
    getStakeAccounts(api, address),
    api.getEpochInfo(),
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

  const stakeBalances = mapStakeAccountsToBalances(stakeAccounts, address, epoch);

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

function mapStakeAccountsToBalances(
  stakeAccounts: StakeAccount[],
  mainAccountAddress: string,
  epoch: number,
): Balance[] {
  return stakeAccounts.map(stakeAccount => ({
    // `value` stays the stake account's full lamports (what the account actually holds); the
    // delegated principal the framework sums into `stakingResources` lives on `stake.amount`.
    value: BigInt(stakeAccount.account.onChainAcc.account.lamports),
    asset: { type: "native" as const },
    stake: mapStakeAccountToFrameworkStake(stakeAccount, mainAccountAddress, epoch),
  }));
}

/**
 * A wallet can own several token accounts for the same mint, but only the canonical associated
 * one is reachable: `craftTransaction` derives it from (owner, mint, program) rather than reading
 * it off the sub-account. Counting the others would report a balance the bridge cannot spend, and
 * a send-max built on it fails at broadcast.
 *
 * This is what the legacy bridge did too — `synchronization.ts:toAssociatedTokenAccount` keeps the
 * associated account and drops the mint entirely when there is none.
 */
function mapTokenAccountsToBalances(
  accounts: ReadonlyArray<ParsedOnChainTokenAccount>,
  tokenProgram: SolanaTokenProgram,
  ownerAddress: string,
): Balance[] {
  const owner = new PublicKey(ownerAddress);
  const programId = getTokenAccountProgramId(tokenProgram);

  return accounts.flatMap(({ pubkey, account }) => {
    const { mint, tokenAmount, state } = account.data.parsed.info;
    const associatedAddress = getAssociatedTokenAddressSync(
      new PublicKey(mint),
      owner,
      undefined,
      programId,
    );
    if (!associatedAddress.equals(pubkey)) return [];

    const value = BigInt(tokenAmount.amount);
    return [
      {
        value,
        asset: {
          type: tokenProgram,
          assetReference: mint,
          assetOwner: ownerAddress,
        },
        // A frozen token account holds funds that cannot be transferred at all.
        ...(state === "frozen" ? { locked: value } : {}),
      },
    ];
  });
}

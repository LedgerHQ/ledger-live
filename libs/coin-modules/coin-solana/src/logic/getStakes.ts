import type { Cursor, Page, Stake, StakeState } from "@ledgerhq/coin-module-framework/api/types";
import { isStakeLockUpInForce, withdrawableFromStake } from "../logic";
import type { ChainAPI } from "../network";
import { getStakeAccounts, type StakeAccount } from "../network/chain/stake-activation/rpc";
import type { SolanaStake } from "../types";
import { estimateTxFee } from "./estimateFees";

export { getStakeAccounts, type StakeAccount } from "../network/chain/stake-activation/rpc";

export async function getStakes(
  api: ChainAPI,
  address: string,
  _cursor?: Cursor,
): Promise<Page<Stake>> {
  const stakeAccounts = await getStakeAccounts(api, address);

  const items: Stake[] = stakeAccounts.map(({ account, activation }) => {
    const delegation = account.info.stake?.delegation;
    const delegateAddress = delegation?.voter.toBase58();

    const stake: Stake = {
      uid: account.onChainAcc.pubkey.toBase58(),
      address: account.onChainAcc.pubkey.toBase58(),
      state: activation.state as StakeState,
      asset: { type: "native" },
      amount: BigInt(account.onChainAcc.account.lamports),
      details: {
        activationEpoch: delegation?.activationEpoch.toString(),
        deactivationEpoch: delegation?.deactivationEpoch.toString(),
        rentExemptReserve: account.info.meta.rentExemptReserve.toString(),
        activeStake: activation.active,
        inactiveStake: activation.inactive,
      },
    };

    if (delegateAddress) {
      stake.delegate = delegateAddress;
    }
    if (delegation) {
      const deposited = BigInt(delegation.stake.toString());
      stake.amountDeposited = deposited;
      stake.amountRewarded = stake.amount > deposited ? stake.amount - deposited : 0n;
    }

    return stake;
  });

  return { items };
}

/**
 * Compute the SOL reserve that must be kept in the main account to cover
 * future unstaking transaction fees (undelegate + withdraw per stake).
 *
 * "active" and "activating" stakes require both deactivating + withdrawing steps.
 * "inactive" and "deactivating" stakes require withdrawing only.
 */
export async function computeUnstakeReserve(
  api: ChainAPI,
  address: string,
  stakeAccounts: StakeAccount[],
): Promise<number> {
  if (stakeAccounts.length === 0) return 0;

  const [undelegateFee, withdrawFee] = await Promise.all([
    estimateTxFee(api, address, "stake.undelegate"),
    estimateTxFee(api, address, "stake.withdraw"),
  ]);

  const activeStakes = stakeAccounts.filter(
    s => s.activation.state === "active" || s.activation.state === "activating",
  );
  return stakeAccounts.length * withdrawFee + activeStakes.length * undelegateFee;
}

/**
 * Convert raw on-chain stake accounts into the legacy {@link SolanaStake} type
 * used throughout the UI (LLD, LLM) and the legacy bridge.
 */
export function mapStakeAccountsToSolanaStakes(
  stakeAccounts: StakeAccount[],
  mainAccAddress: string,
  epoch: number,
): SolanaStake[] {
  return stakeAccounts.map(({ account, activation }) => {
    const {
      info: { meta, stake },
    } = account;
    const rentExemptReserve = meta.rentExemptReserve.toNumber();
    const stakeAccBalance = account.onChainAcc.account.lamports;
    const hasWithdrawAuth =
      meta.authorized.withdrawer.toBase58() === mainAccAddress &&
      !isStakeLockUpInForce({
        lockup: meta.lockup,
        custodianAddress: mainAccAddress,
        epoch,
      });

    return {
      stakeAccAddr: account.onChainAcc.pubkey.toBase58(),
      stakeAccBalance,
      rentExemptReserve,
      hasStakeAuth: meta.authorized.staker.toBase58() === mainAccAddress,
      hasWithdrawAuth,
      delegation:
        stake === null
          ? undefined
          : {
              stake: activation.state === "inactive" ? 0 : stake.delegation.stake.toNumber(),
              voteAccAddr: stake.delegation.voter.toBase58(),
            },
      activation,
      withdrawable: hasWithdrawAuth
        ? withdrawableFromStake({
            stakeAccBalance,
            activation,
            rentExemptReserve,
          })
        : 0,
      reward: undefined,
    };
  });
}

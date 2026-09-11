import type { Cursor, Page, Stake, StakeAction } from "@ledgerhq/coin-module-framework/api/types";
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
  const [stakeAccounts, { epoch }] = await Promise.all([
    getStakeAccounts(api, address),
    api.getEpochInfo(),
  ]);

  const items: Stake[] = stakeAccounts.map(stakeAccount =>
    mapStakeAccountToFrameworkStake(stakeAccount, address, epoch),
  );

  return { items };
}

/**
 * The framework {@link Stake} for one on-chain stake account, shared by {@link getStakes} and
 * `getBalance`. `amount` is the delegated principal, not the account's lamports.
 */
export function mapStakeAccountToFrameworkStake(
  stakeAccount: StakeAccount,
  mainAccAddress: string,
  epoch: number,
): Stake {
  const { account, activation } = stakeAccount;
  const { meta } = account.info;
  const delegation = account.info.stake?.delegation;
  const delegateAddress = delegation?.voter.toBase58();
  const rentExemptReserve = meta.rentExemptReserve.toNumber();

  const { hasStakeAuth, hasWithdrawAuth, withdrawable } = stakeAuthorities(
    stakeAccount,
    mainAccAddress,
    epoch,
    rentExemptReserve,
  );

  const delegated =
    delegation === undefined || activation.state === "inactive"
      ? 0n
      : BigInt(delegation.stake.toString());

  const stake: Stake = {
    uid: account.onChainAcc.pubkey.toBase58(),
    address: account.onChainAcc.pubkey.toBase58(),
    state: activation.state,
    asset: { type: "native" },
    amount: delegated,
    amountDeposited: delegated,
    amountRewarded: 0n,
    actions: computeFrameworkStakeActions(activation.state, withdrawable),
    details: {
      activationEpoch: delegation?.activationEpoch.toString(),
      deactivationEpoch: delegation?.deactivationEpoch.toString(),
      activeAmount: activation.active,
      inactiveAmount: activation.inactive,
      withdrawableAmount: withdrawable,
      lockedReserve: rentExemptReserve,
      canStake: hasStakeAuth,
      canWithdraw: hasWithdrawAuth,
    },
  };

  if (delegateAddress) {
    stake.delegate = delegateAddress;
  }

  return stake;
}

function stakeAuthorities(
  stakeAccount: StakeAccount,
  mainAccAddress: string,
  epoch: number,
  rentExemptReserve: number,
): { hasStakeAuth: boolean; hasWithdrawAuth: boolean; withdrawable: number } {
  const { account, activation } = stakeAccount;
  const { meta } = account.info;
  const hasWithdrawAuth =
    meta.authorized.withdrawer.toBase58() === mainAccAddress &&
    !isStakeLockUpInForce({ lockup: meta.lockup, custodianAddress: mainAccAddress, epoch });

  return {
    hasStakeAuth: meta.authorized.staker.toBase58() === mainAccAddress,
    hasWithdrawAuth,
    withdrawable: hasWithdrawAuth
      ? withdrawableFromStake({
          stakeAccBalance: account.onChainAcc.account.lamports,
          activation,
          rentExemptReserve,
        })
      : 0,
  };
}

function computeFrameworkStakeActions(
  state: SolanaStake["activation"]["state"],
  withdrawable: number,
): StakeAction[] {
  const actions: StakeAction[] = [];
  if (withdrawable > 0) actions.push("claim_reward");

  switch (state) {
    case "active":
    case "activating":
      actions.push("undelegate");
      break;
    case "deactivating":
    case "inactive":
      actions.push("delegate");
      break;
  }
  return actions;
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

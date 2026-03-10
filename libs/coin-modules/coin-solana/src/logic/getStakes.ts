import type { Cursor, Page, Stake, StakeState } from "@ledgerhq/coin-framework/api/types";
import type { ChainAPI } from "../network";
import { getStakeAccounts } from "../network/chain/stake-activation/rpc";

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
      asset: { type: "native" as const },
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
      stake.amountDeposited = BigInt(delegation.stake.toString());
    }

    return stake;
  });

  return { items };
}

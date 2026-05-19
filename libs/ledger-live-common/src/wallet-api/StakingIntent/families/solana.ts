import { stakeActions } from "../../../families/solana/logic";
import type { SolanaAccount } from "../../../families/solana/types";
import { registerFamily } from "../registry";
import type { FamilyIntentConfig } from "../types";

function asSolana(account: Parameters<FamilyIntentConfig["isEnabled"]>[0]): SolanaAccount {
  return account as SolanaAccount;
}

function accountStakeActions(account: SolanaAccount): Set<string> {
  const stakes = account.solanaResources?.stakes ?? [];
  const actions = new Set<string>();
  for (const stake of stakes) {
    for (const action of stakeActions(stake)) {
      actions.add(action);
    }
  }
  return actions;
}

const solanaIntents: FamilyIntentConfig[] = [
  {
    intent: "stake",
    label: "Delegate",
    isEnabled: account => {
      const solanaAccount = asSolana(account);
      return !solanaAccount.balance.isZero() && !solanaAccount.spendableBalance.isZero();
    },
  },
  {
    intent: "unstake",
    label: "Deactivate",
    params: ["validatorAddress"],
    isEnabled: account => accountStakeActions(asSolana(account)).has("deactivate"),
  },
  {
    intent: "restake",
    label: "Reactivate",
    params: ["validatorAddress"],
    isEnabled: account => accountStakeActions(asSolana(account)).has("reactivate"),
  },
  {
    intent: "withdraw",
    label: "Withdraw",
    params: ["validatorAddress"],
    isEnabled: account => accountStakeActions(asSolana(account)).has("withdraw"),
  },
];

registerFamily("solana", solanaIntents);

import { isAccountDelegating } from "../../../families/tezos/staking";
import type { TezosAccount } from "../../../families/tezos/types";
import { registerFamily } from "../registry";
import type { FamilyIntentConfig } from "../types";

function asTezos(account: Parameters<FamilyIntentConfig["isEnabled"]>[0]): TezosAccount {
  return account as TezosAccount;
}

const tezosIntents: FamilyIntentConfig[] = [
  {
    intent: "stake",
    label: "Delegate",
    isEnabled: account => {
      const tezosAccount = asTezos(account);
      return !tezosAccount.balance.isZero() && !isAccountDelegating(tezosAccount);
    },
  },
  {
    intent: "unstake",
    label: "Unstake",
    isEnabled: account => isAccountDelegating(asTezos(account)),
  },
];

registerFamily("tezos", tezosIntents);

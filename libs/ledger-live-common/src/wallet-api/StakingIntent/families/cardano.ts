import { canStake, isAlreadyStaking } from "../../../families/cardano/logic";
import type { CardanoAccount } from "../../../families/cardano/types";
import { registerFamily } from "../registry";
import type { FamilyIntentConfig } from "../types";

function asCardano(account: Parameters<FamilyIntentConfig["isEnabled"]>[0]): CardanoAccount {
  return account as CardanoAccount;
}

const cardanoIntents: FamilyIntentConfig[] = [
  {
    intent: "stake",
    label: "Delegate",
    isEnabled: account => canStake(asCardano(account)) && !isAlreadyStaking(asCardano(account)),
  },
  {
    intent: "unstake",
    label: "Undelegate",
    isEnabled: account => isAlreadyStaking(asCardano(account)),
  },
];

registerFamily("cardano", cardanoIntents);

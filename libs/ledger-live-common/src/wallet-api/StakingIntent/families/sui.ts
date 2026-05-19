import { canStake } from "../../../families/sui/logic";
import type { SuiAccount } from "../../../families/sui/types";
import { registerFamily } from "../registry";
import type { FamilyIntentConfig } from "../types";

function asSui(account: Parameters<FamilyIntentConfig["isEnabled"]>[0]): SuiAccount {
  return account as SuiAccount;
}

const suiIntents: FamilyIntentConfig[] = [
  {
    intent: "stake",
    label: "Delegate",
    isEnabled: account => canStake(asSui(account)),
  },
  {
    intent: "unstake",
    label: "Undelegate",
    params: ["validatorAddress"],
    isEnabled: account => (asSui(account).suiResources?.stakes?.length ?? 0) > 0,
  },
];

registerFamily("sui", suiIntents);

import BigNumber from "bignumber.js";
import { hasMinimumDelegableBalance } from "../../../families/multiversx/helpers";
import type { MultiversXAccount } from "@ledgerhq/coin-multiversx/types";
import { registerFamily } from "../registry";
import type { FamilyIntentConfig } from "../types";

function asMultiversX(account: Parameters<FamilyIntentConfig["isEnabled"]>[0]): MultiversXAccount {
  return account as MultiversXAccount;
}

const multiversxIntents: FamilyIntentConfig[] = [
  {
    intent: "stake",
    label: "Delegate",
    isEnabled: account => hasMinimumDelegableBalance(asMultiversX(account)),
  },
  {
    intent: "unstake",
    label: "Undelegate",
    params: ["validatorAddress"],
    isEnabled: account => {
      const delegations = asMultiversX(account).multiversxResources?.delegations ?? [];
      return delegations.length > 0;
    },
  },
  {
    intent: "claimRewards",
    label: "Claim rewards",
    params: ["validatorAddress"],
    isEnabled: account => {
      const delegations = asMultiversX(account).multiversxResources?.delegations ?? [];
      return delegations.some(d => new BigNumber(d.claimableRewards).gt(0));
    },
  },
  {
    intent: "withdraw",
    label: "Withdraw",
    params: ["validatorAddress"],
    isEnabled: account => {
      const delegations = asMultiversX(account).multiversxResources?.delegations ?? [];
      return delegations.some(d =>
        d.userUndelegatedList.some(u => new BigNumber(u.amount).gt(0) && u.seconds === 0),
      );
    },
  },
];

registerFamily("multiversx", multiversxIntents);

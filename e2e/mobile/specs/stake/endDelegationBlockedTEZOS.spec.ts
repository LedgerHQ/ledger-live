import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runUnstakeRequiredTezos } from "@e2e/specs/stake/stake";

// XTZ_2 (index 1) is DELEGATED + STAKED: stopping delegation is blocked until the user unstakes first.
const delegation = new Delegate({
  account: Account.XTZ_2,
  amount: "N/A",
  provider: "Ledger by Kiln",
});
runUnstakeRequiredTezos({ delegation, action: "stopDelegation", tmsLinks: ["B2CQA-5921"] });

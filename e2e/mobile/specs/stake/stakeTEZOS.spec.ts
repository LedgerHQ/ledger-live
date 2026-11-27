import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runStakeTezos } from "@e2e/specs/stake/stake";

// XTZ_2 (index 1) is DELEGATED + STAKED: Earn opens the stake amount step directly.
const delegation = new Delegate({
  account: Account.XTZ_2,
  amount: "0.005",
  provider: "Ledger by Kiln",
});
runStakeTezos({ delegation, tmsLinks: ["B2CQA-5917"] });

import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runUnstakeTezos } from "@e2e/specs/stake/stake";

// XTZ_3 (index 2): dedicated DELEGATED + STAKED account for unstake, separate from stake's XTZ_2 to avoid a settlement race.
const delegation = new Delegate({
  account: Account.XTZ_3,
  amount: "0.005",
  provider: "Ledger by Kiln",
});
runUnstakeTezos({ delegation, tmsLinks: ["B2CQA-5918"] });

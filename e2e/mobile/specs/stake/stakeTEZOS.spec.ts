import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runStakeTezos } from "./stake";

// XTZ_2 (index 1) is DELEGATED + STAKED: Earn opens the stake amount step directly.
const delegation = new Delegate(Account.XTZ_2, "0.005", "Ledger by Kiln");
runStakeTezos(delegation, ["B2CQA-5917"]);

import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runDelegateCelo } from "./delegate";
import { Delegate } from "@ledgerhq/live-common/e2e/models/Delegate";

const delegation = new Delegate(Account.CELO_1, "0.001", "N/A");
runDelegateCelo(delegation, ["B2CQA-3042"]);

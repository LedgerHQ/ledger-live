import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runLockCelo } from "./delegate";

const delegation = new Delegate(Account.CELO_1, "0.001", "N/A");
runLockCelo(delegation, ["B2CQA-3042"]);

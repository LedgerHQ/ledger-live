import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runVoteCelo } from "./delegate";

const delegation = new Delegate(Account.CELO_1, "0.001", "Ledger by Figment");
runVoteCelo(delegation, ["B2CQA-201"]);

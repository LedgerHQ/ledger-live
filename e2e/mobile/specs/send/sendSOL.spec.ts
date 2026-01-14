import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendTest } from "./send";

const transaction = new Transaction(Account.SOL_1, Account.SOL_2, "0.000001", undefined, "noTag");
runSendTest(transaction, ["B2CQA-2811"]);

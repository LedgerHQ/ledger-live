import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendTest } from "./send";

const transaction = new Transaction(Account.sep_ETH_1, Account.sep_ETH_2, "0.00001", Fee.SLOW);
runSendTest(transaction, ["B2CQA-2574"]);

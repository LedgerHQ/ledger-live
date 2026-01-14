import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendValidAddressTest } from "../send";

const transaction = new Transaction(Account.XRP_1, Account.XRP_2, "1", undefined, "123456");
runSendValidAddressTest(transaction, ["B2CQA-2718"], "with Tag");

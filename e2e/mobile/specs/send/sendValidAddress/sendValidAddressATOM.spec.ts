import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendValidAddressTest } from "../send";

const transaction = new Transaction(Account.ATOM_1, Account.ATOM_2, "0.00001", undefined, "123456");
runSendValidAddressTest(transaction, ["B2CQA-2720"], "with Tag");

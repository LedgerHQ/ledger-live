import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { runSendValidAddressTest } from "../send";

const transaction = new Transaction(Account.ATOM_1, Account.ATOM_2, "0.0001", undefined, "noTag");
runSendValidAddressTest(transaction, ["B2CQA-2721"]);

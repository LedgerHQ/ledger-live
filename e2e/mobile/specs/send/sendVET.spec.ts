import { runSendValidAddressTest } from "./send";

const transaction = new Transaction(Account.VET_1, Account.VET_2, "0.00001", undefined, "123456");
runSendValidAddressTest(transaction, ["B2CQA-2720"], "with Tag");
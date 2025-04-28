import { runSendTest } from "../send/send";

const transaction = new Transaction(Account.ATOM_1, Account.ATOM_2, "0.0001", undefined, "noTag");
runSendTest(transaction, ["B2CQA-2814"]);

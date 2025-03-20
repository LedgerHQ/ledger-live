import { runSendInvalidAmountTest } from "../send";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";

const transaction = new Transaction(Account.ETH_1, Account.ETH_2, "100", Fee.MEDIUM);
runSendInvalidAmountTest(transaction, "Sorry, insufficient funds", ["B2CQA-2572"]);

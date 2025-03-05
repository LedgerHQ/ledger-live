import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { runSendInvalidTokenAmountTest } from "../send";

const transaction = new Transaction(Account.ETH_USDT_1, Account.ETH_USDT_2, "10000");
runSendInvalidTokenAmountTest(transaction, "Sorry, insufficient funds", ["B2CQA-3043"]);

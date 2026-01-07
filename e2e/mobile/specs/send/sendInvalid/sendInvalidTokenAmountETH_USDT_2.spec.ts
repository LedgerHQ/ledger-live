import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendInvalidTokenAmountTest } from "../send";

const transaction = new Transaction(TokenAccount.ETH_USDT_1, TokenAccount.ETH_USDT_2, "10000");
runSendInvalidTokenAmountTest(transaction, "Sorry, insufficient funds", ["B2CQA-3043"]);

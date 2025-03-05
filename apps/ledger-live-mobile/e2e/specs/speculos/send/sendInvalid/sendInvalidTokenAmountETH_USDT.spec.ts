import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { Transaction } from "@ledgerhq/live-common/e2e/models/Transaction";
import { runSendInvalidTokenAmountTest } from "../send";
import { Fee } from "@ledgerhq/live-common/e2e/enum/Fee";

const transaction = new Transaction(Account.ETH_USDT_2, Account.ETH_USDT_1, "1", Fee.FAST);
runSendInvalidTokenAmountTest(
  transaction,
  new RegExp(
    /You need \d+\.\d+ ETH in your account to pay for transaction fees on the Ethereum network\. .*/,
  ),
  ["B2CQA-2701"],
);

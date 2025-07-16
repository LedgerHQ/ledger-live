import { runSendInvalidTokenAmountTest } from "../send";

const transaction = new Transaction(Account.ETH_USDT_2, Account.ETH_USDT_1, "1", Fee.FAST);
runSendInvalidTokenAmountTest(
  transaction,
  new RegExp(
    /You need \d+\.\d+ ETH in your account to pay for transaction fees on the Ethereum network\. .*/,
  ),
  ["B2CQA-2701"],
);

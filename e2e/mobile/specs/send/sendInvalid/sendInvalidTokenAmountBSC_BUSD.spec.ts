import { runSendInvalidTokenAmountTest } from "../send";

const transaction = new Transaction(Account.BSC_BUSD_1, Account.BSC_BUSD_2, "1", Fee.FAST);
runSendInvalidTokenAmountTest(
  transaction,
  new RegExp(
    /You need \d+\.\d+ BNB in your account to pay for transaction fees on the Binance Smart Chain network\. .*/,
  ),
  ["B2CQA-2700"],
);

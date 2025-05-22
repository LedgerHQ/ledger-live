import { runSendValidAddressTest } from "../send";

const transaction = new Transaction(Account.ETH_USDT_1, Account.ETH_USDT_2, "1", Fee.MEDIUM);
runSendValidAddressTest(
  transaction,
  ["B2CQA-2703", "B2CQA-475"],
  transaction.accountToDebit.currency.name,
);

import { runSendInvalidAddressTest } from "../send";

const transaction = new Transaction(Account.ALGO_USDT_1, Account.ALGO_USDT_2, "0.1", Fee.MEDIUM);
runSendInvalidAddressTest(
  transaction,
  "Recipient account has not opted in the selected ASA.",
  ["B2CQA-2702"],
  transaction.accountToDebit.currency.name,
);

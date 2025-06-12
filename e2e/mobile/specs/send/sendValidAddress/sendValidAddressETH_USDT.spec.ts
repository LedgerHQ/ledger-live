import { runSendValidAddressTest } from "../send";

const transaction = new Transaction(
  TokenAccount.ETH_USDT_1,
  TokenAccount.ETH_USDT_2,
  "1",
  Fee.MEDIUM,
);
runSendValidAddressTest(
  transaction,
  ["B2CQA-2703", "B2CQA-475"],
  "Recipient and Amount",
  ["@NanoSP", "@LNS", "@NanoX"],
  transaction.accountToDebit.currency.name,
);

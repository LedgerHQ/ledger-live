import { runSendValidAddressTest } from "@e2e/specs/send/send";

const transaction = new Transaction(
  TokenAccount.ETH_USDT_1,
  TokenAccount.ETH_USDT_2,
  "1",
  Fee.MEDIUM,
);
runSendValidAddressTest(
  transaction,
  ["B2CQA-2703"],
  "recipient and amount",
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
  transaction.accountToDebit.currency.name,
);

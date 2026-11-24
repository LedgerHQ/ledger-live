import { runSendValidAddressTest } from "@e2e/specs/send/send";

const transaction = new Transaction(
  TokenAccount.ETH_USDT_1,
  TokenAccount.ETH_USDT_2,
  "1",
  Fee.MEDIUM,
);
runSendValidAddressTest({
  transaction,
  tmsLinks: ["B2CQA-2703"],
  scenario: "recipient and amount",
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
  accountName: transaction.accountToDebit.currency.name,
});

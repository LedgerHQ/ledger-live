import { runSendInvalidTokenAmountTest } from "@e2e/specs/send/send";

const transaction = new Transaction({
  accountToDebit: TokenAccount.ETH_USDT_1,
  accountToCredit: TokenAccount.ETH_USDT_2,
  amount: "10000",
});
runSendInvalidTokenAmountTest({
  transaction,
  expectedErrorMessage: "Sorry, insufficient funds",
  tmsLinks: ["B2CQA-3043"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
});

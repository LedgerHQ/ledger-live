import { runSendInvalidTokenAmountTest } from "@e2e/specs/send/send";

const transaction = new Transaction({
  accountToDebit: TokenAccount.ETH_USDT_2,
  accountToCredit: TokenAccount.ETH_USDT_1,
  amount: "1",
  speed: Fee.FAST,
});
runSendInvalidTokenAmountTest({
  transaction,
  expectedErrorMessage: new RegExp(
    /You need \d+\.\d+ ETH in your account to pay for transaction fees on the Ethereum network\. .*/,
  ),
  tmsLinks: ["B2CQA-2701"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
});

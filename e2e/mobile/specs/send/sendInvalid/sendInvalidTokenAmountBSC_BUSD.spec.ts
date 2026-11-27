import { runSendInvalidTokenAmountTest } from "@e2e/specs/send/send";

const transaction = new Transaction({
  accountToDebit: TokenAccount.BSC_BUSD_1,
  accountToCredit: TokenAccount.BSC_BUSD_2,
  amount: "1",
  speed: Fee.FAST,
});
runSendInvalidTokenAmountTest({
  transaction,
  expectedErrorMessage: new RegExp(
    /You need \d+\.\d+ BNB in your account to pay for transaction fees on the BNB Smart Chain network\. .*/,
  ),
  tmsLinks: ["B2CQA-2700"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@bsc", "@family-evm"],
});

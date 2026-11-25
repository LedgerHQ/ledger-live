import { runSendInvalidTokenAmountTest } from "@e2e/specs/send/send";

const transaction = new Transaction(
  TokenAccount.BSC_BUSD_1,
  TokenAccount.BSC_BUSD_2,
  "1",
  Fee.FAST,
);
runSendInvalidTokenAmountTest({
  transaction,
  expectedErrorMessage: new RegExp(
    /You need \d+\.\d+ BNB in your account to pay for transaction fees on the BNB Smart Chain network\. .*/,
  ),
  tmsLinks: ["B2CQA-2700"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@bsc", "@family-evm"],
});

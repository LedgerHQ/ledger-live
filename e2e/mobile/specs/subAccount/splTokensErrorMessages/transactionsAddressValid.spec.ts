import { runSendSPLAddressValid } from "@e2e/specs/subAccount/subAccount";
const transactionE2E = {
  tx: new Transaction({
    accountToDebit: TokenAccount.SOL_GIGA_1,
    accountToCredit: TokenAccount.SOL_GIGA_2,
    amount: "0.1",
  }),
  expectedWarningMessage:
    "This is not a regular wallet address but an associated token account. Continue only if you know what you are doing",
  xrayTicket: ["B2CQA-3082"],
  tag: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@solana", "@family-solana"],
};
runSendSPLAddressValid({
  transaction: transactionE2E.tx,
  expectedWarningMessage: transactionE2E.expectedWarningMessage,
  tmsLinks: transactionE2E.xrayTicket,
  tags: transactionE2E.tag,
});

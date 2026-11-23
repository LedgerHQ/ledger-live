import { runSendSPLAddressInvalid } from "@e2e/specs/subAccount/subAccount";

const transactionE2E = {
  tx: new Transaction(TokenAccount.SOL_WIF_1, TokenAccount.SOL_GIGA_2, "0.1", undefined),
  recipient: TokenAccount.SOL_GIGA_2.currency.contractAddress,
  expectedErrorMessage: "This is a token address. Input a regular wallet address",
  scenario: "token address",
  xrayTicket: ["B2CQA-3086"],
  tag: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@solana", "@family-solana"],
};

runSendSPLAddressInvalid({
  transaction: transactionE2E.tx,
  recipientContractAddress: transactionE2E.recipient,
  expectedErrorMessage: transactionE2E.expectedErrorMessage,
  scenario: transactionE2E.scenario,
  tmsLinks: transactionE2E.xrayTicket,
  tags: transactionE2E.tag,
});

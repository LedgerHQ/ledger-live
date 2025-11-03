import { runSendSPLAddressInvalid } from "../subAccount";

const transactionE2E = {
  tx: new Transaction(TokenAccount.SOL_WIF_1, TokenAccount.SOL_GIGA_2, "0.1", undefined),
  recipient: TokenAccount.SOL_GIGA_2.currency.contractAddress,
  expectedErrorMessage: "This is a token address. Input a regular wallet address",
  xrayTicket: ["B2CQA-3086"],
  tag: ["@NanoSP", "@NanoX", "@Stax", "@Flex"],
};

runSendSPLAddressInvalid(
  transactionE2E.tx,
  transactionE2E.recipient,
  transactionE2E.expectedErrorMessage,
  transactionE2E.xrayTicket,
  transactionE2E.tag,
);

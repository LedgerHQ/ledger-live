import { runSendSPLAddressValid } from "../subAccount";
const transactionE2E = {
  tx: new Transaction(TokenAccount.SOL_GIGA_1, TokenAccount.SOL_GIGA_2, "0.1", undefined),
  expectedWarningMessage:
    "This is not a regular wallet address but an associated token account. Continue only if you know what you are doing",
  xrayTicket: ["B2CQA-3082"],
  tag: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};
runSendSPLAddressValid(
  transactionE2E.tx,
  transactionE2E.expectedWarningMessage,
  transactionE2E.xrayTicket,
  transactionE2E.tag,
);

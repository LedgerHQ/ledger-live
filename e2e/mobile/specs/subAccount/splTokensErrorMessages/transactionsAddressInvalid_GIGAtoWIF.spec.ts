import { runSendSPLAddressInvalid } from "../subAccount";

const transactionE2E = {
  tx: new Transaction(TokenAccount.SOL_GIGA_1, TokenAccount.SOL_WIF_2, "0.1", undefined),
  recipient: TokenAccount.SOL_WIF_2.address,
  expectedErrorMessage: "This associated token account holds another token",
  xrayTicket: ["B2CQA-3083"],
  tag: ["@NanoSP", "@NanoX", "@Stax", "@Flex"],
};

runSendSPLAddressInvalid(
  transactionE2E.tx,
  transactionE2E.recipient,
  transactionE2E.expectedErrorMessage,
  transactionE2E.xrayTicket,
  transactionE2E.tag,
);

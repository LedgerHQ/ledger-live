import { runSendSPLAddressInvalid } from "../subAccount";

const transactionE2E = {
  tx: new Transaction(Account.SOL_1, TokenAccount.SOL_GIGA_2, "0.1", undefined),
  recipient: TokenAccount.SOL_GIGA_2.address,
  expectedErrorMessage: "This is a token account. Input a regular wallet address",
  xrayTicket: ["B2CQA-3084"],
  tag: ["@NanoSP", "@NanoX", "@Stax", "@Flex"],
};

runSendSPLAddressInvalid(
  transactionE2E.tx,
  transactionE2E.recipient,
  transactionE2E.expectedErrorMessage,
  transactionE2E.xrayTicket,
  transactionE2E.tag,
);

import { runSendSPLAddressInvalid } from "../subAccount";

const transactionE2E = {
  tx: new Transaction(Account.SOL_1, TokenAccount.SOL_WIF_2, "0.1", undefined),
  recipient: TokenAccount.SOL_WIF_2.currency.contractAddress,
  expectedErrorMessage: "This is a token address. Input a regular wallet address",
  xrayTicket: ["B2CQA-3087"],
};

runSendSPLAddressInvalid(
  transactionE2E.tx,
  transactionE2E.recipient,
  transactionE2E.expectedErrorMessage,
  transactionE2E.xrayTicket,
);

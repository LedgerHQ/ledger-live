import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendSPLAddressInvalid } from "../subAccount";
import { Addresses } from "@ledgerhq/live-common/e2e/enum/Addresses";

const transactionE2E = {
  tx: new Transaction(Account.SOL_1, TokenAccount.SOL_GIGA_2, "0.1", undefined),
  recipient: Addresses.SOL_GIGA_2_ATA_ADDRESS,
  expectedErrorMessage: "This is a token account. Input a regular wallet address",
  xrayTicket: ["B2CQA-3084"],
  tag: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runSendSPLAddressInvalid(
  transactionE2E.tx,
  transactionE2E.recipient,
  transactionE2E.expectedErrorMessage,
  transactionE2E.xrayTicket,
  transactionE2E.tag,
);

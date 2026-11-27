import { runSendSPLAddressInvalid } from "@e2e/specs/subAccount/subAccount";
import { Addresses } from "@ledgerhq/live-e2e-shared/enum/Addresses";

const transactionE2E = {
  tx: new Transaction({
    accountToDebit: TokenAccount.SOL_GIGA_1,
    accountToCredit: TokenAccount.SOL_WIF_2,
    amount: "0.1",
  }),
  recipient: Addresses.SOL_WIF_2_ATA_ADDRESS,
  expectedErrorMessage: "This associated token account holds another token",
  scenario: "recipient holds another token",
  xrayTicket: ["B2CQA-3083"],
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

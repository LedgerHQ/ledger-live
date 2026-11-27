import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendSPLAddressInvalid } from "@e2e/specs/subAccount/subAccount";
import { Addresses } from "@ledgerhq/live-e2e-shared/enum/Addresses";

const transactionE2E = {
  tx: new Transaction({
    accountToDebit: Account.SOL_1,
    accountToCredit: TokenAccount.SOL_GIGA_2,
    amount: "0.1",
  }),
  recipient: Addresses.SOL_GIGA_2_ATA_ADDRESS,
  expectedErrorMessage: "This is a token account. Input a regular wallet address",
  scenario: "token account",
  xrayTicket: ["B2CQA-3084"],
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

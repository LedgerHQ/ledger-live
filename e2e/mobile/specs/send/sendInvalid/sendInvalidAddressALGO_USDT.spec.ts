import { Account, TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendInvalidAddressTest } from "@e2e/specs/send/send";

const transaction = new Transaction(
  TokenAccount.ALGO_USDT_1,
  Account.ALGO_3,
  "0.1",
  undefined,
  "noTag",
);
runSendInvalidAddressTest({
  transaction,
  expectedErrorMessage: "Recipient account has not opted in the selected ASA.",
  tmsLinks: ["B2CQA-2702"],
  tags: [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@algorand",
    "@family-algorand",
  ],
  accountName: transaction.accountToDebit.currency.name,
});

import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendValidAddressTest } from "@e2e/specs/send/send";

const transaction = new Transaction(Account.BCH_1, Account.BCH_2, "0.0001", Fee.MEDIUM);
runSendValidAddressTest({
  transaction,
  tmsLinks: ["B2CQA-2726"],
  scenario: "cash address",
  tags: [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@bitcoin_cash",
    "@family-bitcoin",
  ],
});

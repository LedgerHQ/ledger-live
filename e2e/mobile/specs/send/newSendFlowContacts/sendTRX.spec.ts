import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Addresses } from "@ledgerhq/live-e2e-shared/enum/Addresses";
import { runNewSendFlowContactsTest } from "@e2e/specs/send/newSendFlowContacts";

const transaction = new Transaction(Account.TRX_1, Account.TRX_2, "0.01");

runNewSendFlowContactsTest(
  transaction,
  Addresses.TRON_SPARE,
  ["B2CQA-6548", "B2CQA-6549", "B2CQA-6550"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@tron", "@family-tron"],
);

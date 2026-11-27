import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Addresses } from "@ledgerhq/live-e2e-shared/enum/Addresses";
import { runNewSendFlowContactsTest } from "@e2e/specs/send/newSendFlowContacts";

const transaction = new Transaction({
  accountToDebit: Account.TRX_1,
  accountToCredit: Account.TRX_2,
  amount: "0.01",
});

runNewSendFlowContactsTest({
  transaction,
  spareAddress: Addresses.TRON_SPARE,
  retrievalAccount: Account.TRX_3,
  tmsLinks: ["B2CQA-6548", "B2CQA-6549", "B2CQA-6550"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@tron", "@family-tron"],
});

import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Addresses } from "@ledgerhq/live-e2e-shared/enum/Addresses";
import { runNewSendFlowContactsTest } from "@e2e/specs/send/newSendFlowContacts";

const transaction = new Transaction(Account.ETH_1, Account.ETH_3, "0.00001");

runNewSendFlowContactsTest(
  transaction,
  Addresses.EVM_SPARE,
  ["B2CQA-6548", "B2CQA-6549", "B2CQA-6550"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
);

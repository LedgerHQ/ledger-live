import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Addresses } from "@ledgerhq/live-e2e-shared/enum/Addresses";
import { Fee } from "@ledgerhq/live-e2e-shared/enum/Fee";
import { Transaction } from "@ledgerhq/live-e2e-shared/models/Transaction";
import {
  ContactsEntry,
  registerContactRetrievalTests,
  registerSendViaContactTests,
} from "tests/utils/newSendFlowContactsUtils";

const sendViaContactTransactions: ContactsEntry[] = [
  {
    transaction: new Transaction(Account.sep_ETH_1, Account.sep_ETH_2, "0.00001", Fee.SLOW),
    spareAddress: Addresses.EVM_SPARE,
    xrayTicket: "B2CQA-6548",
  },
  {
    transaction: new Transaction(Account.TRX_1, Account.TRX_2, "0.01"),
    spareAddress: Addresses.TRON_SPARE,
    xrayTicket: "B2CQA-6548",
  },
];

/** These also assert Add contact availability on an unknown recipient (the spare address). */
const contactRetrievalTransactions: ContactsEntry[] = [
  {
    transaction: new Transaction(Account.ETH_1, Account.ETH_2_WITH_ENS, "0.0001"),
    spareAddress: Addresses.EVM_SPARE,
    xrayTicket: "B2CQA-6549, B2CQA-6550",
  },
  {
    transaction: new Transaction(Account.TRX_1, Account.TRX_2, "0.01"),
    spareAddress: Addresses.TRON_SPARE,
    xrayTicket: "B2CQA-6549, B2CQA-6550",
  },
];

registerSendViaContactTests(sendViaContactTransactions);
registerContactRetrievalTests(contactRetrievalTransactions);

import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Fee } from "@ledgerhq/live-e2e-shared/enum/Fee";
import { Transaction } from "@ledgerhq/live-e2e-shared/models/Transaction";
import {
  AddContactAvailabilityEntry,
  ContactRetrievalEntry,
  EVM_SPARE_ADDRESS,
  registerAddContactAvailabilityTests,
  registerContactRetrievalTests,
  registerSendViaContactTests,
  SendViaContactEntry,
  TRON_SPARE_ADDRESS,
} from "tests/utils/newSendFlowContactsUtils";

const sendViaContactTransactions: SendViaContactEntry[] = [
  {
    transaction: new Transaction(Account.sep_ETH_1, Account.sep_ETH_2, "0.00001", Fee.SLOW),
    spareAddress: EVM_SPARE_ADDRESS,
    xrayTicket: "B2CQA-6548",
  },
  {
    transaction: new Transaction(Account.TRX_1, Account.TRX_2, "0.01"),
    spareAddress: TRON_SPARE_ADDRESS,
    xrayTicket: "B2CQA-6548",
  },
];

const contactRetrievalTransactions: ContactRetrievalEntry[] = [
  {
    transaction: new Transaction(Account.ETH_1, Account.ETH_2_WITH_ENS, "0.0001"),
    xrayTicket: "B2CQA-6549",
  },
  {
    transaction: new Transaction(Account.TRX_1, Account.TRX_2, "0.01"),
    xrayTicket: "B2CQA-6549",
  },
];

/** When a family gains Address Book support, flip its flag here instead of adding a test. */
const addContactAvailabilityTransactions: AddContactAvailabilityEntry[] = [
  {
    transaction: new Transaction(Account.ETH_1, Account.ETH_3, "0.00001"),
    isAddressBookSupported: true,
    xrayTicket: "B2CQA-6550",
  },
  {
    transaction: new Transaction(Account.TRX_1, Account.TRX_2, "0.01"),
    isAddressBookSupported: true,
    xrayTicket: "B2CQA-6550",
  },
  {
    transaction: new Transaction(
      Account.BTC_NATIVE_SEGWIT_1,
      Account.BTC_NATIVE_SEGWIT_2,
      "0.00001",
    ),
    isAddressBookSupported: false,
    xrayTicket: "B2CQA-6550",
  },
];

registerSendViaContactTests(sendViaContactTransactions);
registerContactRetrievalTests(contactRetrievalTransactions);
registerAddContactAvailabilityTests(addContactAvailabilityTransactions);

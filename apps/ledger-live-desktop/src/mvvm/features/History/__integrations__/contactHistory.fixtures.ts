import BigNumber from "bignumber.js";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import {
  mockContact,
  mockContactAddress,
  mockDeviceContactGroupCredentials,
} from "@domain/entity-contact/schema.mock";
import type { Account, Operation } from "@ledgerhq/types-live";
import { ethereumCurrency } from "../../__mocks__/useSelectAssetFlow.mock";

export const CONTACT_HISTORY_ID = "contact-alice";
export const CONTACT_HISTORY_NAME = "Alice";
export const CONTACT_HISTORY_ADDRESS = "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034";
export const OTHER_HISTORY_ADDRESS = "0xdeadbeef00000000000000000000000000000000";
export const OUT_TO_CONTACT_OP_ID = "out-to-alice";
export const IN_FROM_CONTACT_OP_ID = "in-from-alice";
export const OUT_TO_OTHER_OP_ID = "out-to-other";

function createTransfer(
  accountId: string,
  id: string,
  type: "IN" | "OUT",
  parties: { senders: string[]; recipients: string[] },
  date: Date,
): Operation {
  return {
    id,
    hash: id,
    type,
    value: new BigNumber(10),
    fee: new BigNumber(0),
    senders: parties.senders,
    recipients: parties.recipients,
    blockHash: "0xblock",
    blockHeight: 1,
    accountId,
    date,
    extra: {},
  };
}

export function createEthAccountWithContactTransfers(): Account {
  const account = genAccount("eth-contact-history", {
    currency: ethereumCurrency,
    subAccountsCount: 0,
    operationsSize: 0,
  });
  const operations = [
    createTransfer(
      account.id,
      OUT_TO_CONTACT_OP_ID,
      "OUT",
      { senders: [OTHER_HISTORY_ADDRESS], recipients: [CONTACT_HISTORY_ADDRESS] },
      new Date("2026-08-31T12:00:00Z"),
    ),
    createTransfer(
      account.id,
      IN_FROM_CONTACT_OP_ID,
      "IN",
      { senders: [CONTACT_HISTORY_ADDRESS], recipients: [OTHER_HISTORY_ADDRESS] },
      new Date("2026-08-31T11:00:00Z"),
    ),
    createTransfer(
      account.id,
      OUT_TO_OTHER_OP_ID,
      "OUT",
      { senders: [OTHER_HISTORY_ADDRESS], recipients: [OTHER_HISTORY_ADDRESS] },
      new Date("2026-08-31T10:00:00Z"),
    ),
  ];

  return { ...account, operations, operationsCount: operations.length };
}

export function aliceContact() {
  return mockContact({
    id: CONTACT_HISTORY_ID,
    name: CONTACT_HISTORY_NAME,
    addresses: [
      mockContactAddress({
        id: "addr-alice-eth",
        currencyId: "ethereum",
        label: "Ethereum",
        address: CONTACT_HISTORY_ADDRESS,
      }),
    ],
    deviceCredentials: mockDeviceContactGroupCredentials(),
  });
}

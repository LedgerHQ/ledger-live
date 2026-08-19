import { z } from "zod";
import { DEFAULT_ME_CONTACT_ID, DEFAULT_ME_CONTACT_NAME } from "../constants";
import { ContactSchema } from "../schema";
import type { Contact } from "../types";
import { isValidContactsWire, type ContactsWire, type DistantAddress } from "./distantSchema";

export const emptyDistantContactsState: ContactsWire = {
  me: { name: DEFAULT_ME_CONTACT_NAME, addresses: [] },
  contactGroups: [],
};

export function toContactsWire(localData: readonly Contact[]): ContactsWire | null {
  const result = z.array(ContactSchema).safeParse(localData);
  if (!result.success) {
    return null;
  }

  const meContacts = result.data.filter(contact => contact.isMe);
  if (meContacts.length !== 1 || meContacts[0]?.id !== DEFAULT_ME_CONTACT_ID) {
    return null;
  }

  const me = meContacts[0];
  const wire = {
    me: {
      name: me.name,
      ...(me.deviceCredentials === undefined ? {} : { deviceCredentials: me.deviceCredentials }),
      addresses: me.addresses,
    },
    contactGroups: result.data
      .filter(contact => !contact.isMe)
      .map(({ id, name, deviceCredentials, addresses }) => ({
        id,
        name,
        ...(deviceCredentials === undefined ? {} : { deviceCredentials }),
        addresses,
      })),
  };

  return isValidContactsWire(wire) ? wire : null;
}

export function toLocalContacts(wire: ContactsWire): Contact[] | null {
  const input = [
    {
      id: DEFAULT_ME_CONTACT_ID,
      isMe: true,
      name: wire.me.name,
      deviceCredentials: wire.me.deviceCredentials,
      addresses: wire.me.addresses,
    },
    ...wire.contactGroups.map(contactGroup => ({
      id: contactGroup.id,
      isMe: false,
      name: contactGroup.name,
      deviceCredentials: contactGroup.deviceCredentials,
      addresses: contactGroup.addresses,
    })),
  ];
  const result = z.array(ContactSchema).safeParse(input);

  return result.success ? result.data : null;
}

function sameDeviceCredentials(
  left: ContactsWire["me"]["deviceCredentials"],
  right: ContactsWire["me"]["deviceCredentials"],
): boolean {
  return (
    left === right ||
    (left !== undefined &&
      right !== undefined &&
      left.groupHandle === right.groupHandle &&
      left.hmacProof === right.hmacProof)
  );
}

function sameAddress(left: DistantAddress, right: DistantAddress): boolean {
  return (
    left.id === right.id &&
    left.currencyId === right.currencyId &&
    left.label === right.label &&
    left.address === right.address &&
    left.device.blockchainFamily === right.device.blockchainFamily &&
    left.device.chainId === right.device.chainId &&
    left.device.hmacRest === right.device.hmacRest
  );
}

function sameAddressList(
  left: readonly DistantAddress[],
  right: readonly DistantAddress[],
): boolean {
  return (
    left.length === right.length &&
    left.every((address, index) => {
      const otherAddress = right[index];
      return otherAddress !== undefined && sameAddress(address, otherAddress);
    })
  );
}

export function hasSameContactsWire(left: ContactsWire, right: ContactsWire): boolean {
  return (
    left.me.name === right.me.name &&
    sameDeviceCredentials(left.me.deviceCredentials, right.me.deviceCredentials) &&
    sameAddressList(left.me.addresses, right.me.addresses) &&
    left.contactGroups.length === right.contactGroups.length &&
    left.contactGroups.every((contactGroup, index) => {
      const otherContactGroup = right.contactGroups[index];
      return (
        otherContactGroup !== undefined &&
        contactGroup.id === otherContactGroup.id &&
        contactGroup.name === otherContactGroup.name &&
        sameDeviceCredentials(
          contactGroup.deviceCredentials,
          otherContactGroup.deviceCredentials,
        ) &&
        sameAddressList(contactGroup.addresses, otherContactGroup.addresses)
      );
    })
  );
}

export function isUntouchedContactsWire(wire: ContactsWire): boolean {
  return (
    wire.me.name === DEFAULT_ME_CONTACT_NAME &&
    wire.me.deviceCredentials === undefined &&
    wire.me.addresses.length === 0 &&
    wire.contactGroups.length === 0
  );
}

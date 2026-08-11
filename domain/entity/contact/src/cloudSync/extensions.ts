import {
  asDistantRecord,
  ContactsDistantSchema,
  type ContactsWire,
  type DistantAddress,
  type DistantContact,
  type DistantContactGroup,
  type DistantRecord,
} from "./distantSchema";

function rawValuesById(value: unknown): ReadonlyMap<string, DistantRecord> {
  if (!Array.isArray(value)) {
    return new Map();
  }

  return new Map(
    value.flatMap(item => {
      const record = asDistantRecord(item);
      return record !== null && typeof record.id === "string" ? [[record.id, record] as const] : [];
    }),
  );
}

function mergeDistantRecord(rawValue: unknown, ownedValues: object): DistantRecord {
  const rawRecord = asDistantRecord(rawValue);
  return rawRecord === null ? { ...ownedValues } : { ...rawRecord, ...ownedValues };
}

function mergeDeviceCredentialsExtensions(
  credentials: ContactsWire["me"]["deviceCredentials"],
  rawCredentials: unknown,
): DistantRecord | undefined {
  return credentials === undefined ? undefined : mergeDistantRecord(rawCredentials, credentials);
}

function mergeAddressExtensions(
  address: DistantAddress,
  rawAddress: DistantRecord | undefined,
): DistantRecord {
  const { device: _rawDevice, ...rawAddressExtensions } = rawAddress ?? {};

  return {
    ...rawAddressExtensions,
    id: address.id,
    currencyId: address.currencyId,
    label: address.label,
    address: address.address,
    device: mergeDistantRecord(rawAddress?.device, address.device),
  };
}

function mergeAddressListExtensions(
  addresses: readonly DistantAddress[],
  rawAddresses: unknown,
): DistantRecord[] {
  const rawAddressesById = rawValuesById(rawAddresses);
  return addresses.map(address =>
    mergeAddressExtensions(address, rawAddressesById.get(address.id)),
  );
}

function mergeContactExtensions(
  contact: DistantContact | DistantContactGroup,
  rawContact: DistantRecord | undefined,
  includeId: boolean,
): DistantRecord {
  const {
    id: _rawId,
    isMe: _rawIsMe,
    deviceCredentials: _rawCredentials,
    ...rawExtensions
  } = rawContact ?? {};
  const credentials = mergeDeviceCredentialsExtensions(
    contact.deviceCredentials,
    rawContact?.deviceCredentials,
  );

  return {
    ...rawExtensions,
    ...(includeId && "id" in contact ? { id: contact.id } : {}),
    name: contact.name,
    ...(credentials === undefined ? {} : { deviceCredentials: credentials }),
    addresses: mergeAddressListExtensions(contact.addresses, rawContact?.addresses),
  };
}

export function mergeContactsDistantExtensions(
  latestState: unknown,
  localWire: ContactsWire,
): ContactsWire {
  const latest = asDistantRecord(latestState);
  const latestMe = asDistantRecord(latest?.me);
  const latestContactGroupsById = rawValuesById(latest?.contactGroups);
  const { me: _rawMe, contactGroups: _rawContactGroups, ...rootExtensions } = latest ?? {};

  return ContactsDistantSchema.parse({
    ...rootExtensions,
    me: mergeContactExtensions(localWire.me, latestMe ?? undefined, false),
    contactGroups: localWire.contactGroups.map(contactGroup =>
      mergeContactExtensions(contactGroup, latestContactGroupsById.get(contactGroup.id), true),
    ),
  });
}

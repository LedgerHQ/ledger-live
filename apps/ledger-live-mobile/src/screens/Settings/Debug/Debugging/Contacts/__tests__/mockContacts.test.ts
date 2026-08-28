import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { AccountLike, Operation } from "@ledgerhq/types-live";
import { createContactsDebugSamples, createContactsFromSendHistory } from "../mockContacts";

describe("createContactsDebugSamples", () => {
  it("creates 25 saved contacts across the section index", () => {
    const contacts = createContactsDebugSamples();

    expect(contacts).toHaveLength(25);
    expect(contacts.every(contact => !contact.isMe)).toBe(true);
    expect(contacts.map(contact => contact.name)).toContain("\u042f\u043d\u0430");
    expect(contacts.find(contact => contact.name === "David")?.addresses).toHaveLength(3);
    expect(
      contacts
        .filter(contact => contact.addresses.length > 0)
        .every(contact => contact.deviceCredentials !== undefined),
    ).toBe(true);
    expect(contacts.flatMap(contact => contact.addresses).every(address => address.device)).toBe(
      true,
    );
  });
});

function outOperation(id: string, recipient: string, date: string): Operation {
  return {
    type: "OUT",
    id,
    recipients: [recipient],
    date: new Date(date),
  } as Operation;
}

function ethereumAccount(
  operations: Operation[],
  pendingOperations: Operation[] = [],
): AccountLike {
  return {
    type: "Account",
    currency: getCryptoCurrencyById("ethereum"),
    operations,
    pendingOperations,
  } as AccountLike;
}

describe("createContactsFromSendHistory", () => {
  it("returns no contacts when accounts have no outgoing operations", () => {
    const account = ethereumAccount([outOperation("in-1", "0xaaa", "2026-01-01")]);
    account.operations[0].type = "IN";

    expect(createContactsFromSendHistory([account])).toEqual([]);
  });

  it("creates one contact per distinct recipient ordered by last sent-to", () => {
    const older = "0x1111111111111111111111111111111111111111";
    const newer = "0x2222222222222222222222222222222222222222";
    const account = ethereumAccount([
      outOperation("op-1", older, "2026-01-01"),
      outOperation("op-2", newer, "2026-03-01"),
      outOperation("op-3", older, "2026-02-01"),
    ]);

    const contacts = createContactsFromSendHistory([account]);

    expect(contacts.map(contact => contact.addresses[0]?.address)).toEqual([newer, older]);
    expect(contacts.every(contact => !contact.isMe)).toBe(true);
    expect(contacts.every(contact => contact.deviceCredentials !== undefined)).toBe(true);
  });

  it("keeps a pending operation as the most recent send", () => {
    const address = "0x3333333333333333333333333333333333333333";
    const account = ethereumAccount(
      [outOperation("op-1", address, "2026-01-01")],
      [outOperation("pending-1", address, "2026-05-01")],
    );

    const contacts = createContactsFromSendHistory([account]);

    expect(contacts).toHaveLength(1);
    expect(contacts[0].addresses[0]?.address).toBe(address);
  });
});

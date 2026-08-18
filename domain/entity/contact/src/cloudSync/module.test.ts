import { describeCloudSyncModuleContract } from "@shared/cloud-sync-module/moduleRequirements";
import { ContactsDistantSchema, contactsSyncModule } from "./module";
import {
  mockContact,
  mockContactAddress,
  mockContactWithMultipleAddresses,
  mockEmptyContacts,
  mockMeContact,
  mockMeContactWithAddresses,
  mockPopulatedContacts,
} from "../schema.mock";
import type { Contact } from "../types";

function toWire(contacts: Contact[]) {
  return ContactsDistantSchema.parse(
    contactsSyncModule.diffLocalToDistant(contacts, null).nextState,
  );
}

const populatedContacts = mockPopulatedContacts();

describeCloudSyncModuleContract("contactsSyncModule contract", contactsSyncModule, {
  emptyLocalState: mockEmptyContacts(),
  nonEmptyLocalState: populatedContacts,
  matchingDistantState: toWire(populatedContacts),
});

describe("ContactsDistantSchema", () => {
  it("should accept additive fields while requiring the permanent document shape", () => {
    const input = { ...toWire(mockEmptyContacts()), futureField: true };

    expect(ContactsDistantSchema.safeParse(input).success).toBe(true);
    expect(ContactsDistantSchema.safeParse({ me: { name: "Me", addresses: [] } }).success).toBe(
      false,
    );
  });
});

describe("contactsSyncModule.diffLocalToDistant", () => {
  it("should not create a distant state for the untouched default Me contact", () => {
    expect(contactsSyncModule.diffLocalToDistant(mockEmptyContacts(), null)).toEqual({
      hasChanges: false,
      nextState: { me: { name: "Me", addresses: [] }, contactGroups: [] },
    });
  });

  it("should publish signed data without Me local identifiers", () => {
    const local = [
      mockMeContactWithAddresses({ name: "Raphael" }),
      mockContactWithMultipleAddresses(),
    ];
    const wire = toWire(local);

    expect(wire.me).toMatchObject({ name: "Raphael" });
    expect(wire.me).not.toHaveProperty("id");
    expect(wire.me).not.toHaveProperty("isMe");
    expect(wire.me.deviceCredentials).toBeDefined();
    expect(wire.contactGroups[0]).toMatchObject({ id: local[1]?.id, name: local[1]?.name });
    expect(wire.contactGroups[0]?.addresses).toEqual(local[1]?.addresses);
  });

  it("should preserve the insertion order of contact groups and addresses", () => {
    const local = [
      mockMeContactWithAddresses(),
      mockContact({ id: "contact-zed", name: "Zed" }),
      mockContactWithMultipleAddresses({ id: "contact-ada", name: "Ada" }),
    ];
    const wire = toWire(local);

    expect(wire.contactGroups.map(contact => contact.id)).toEqual(["contact-zed", "contact-ada"]);
    expect(wire.contactGroups[1]?.addresses.map(address => address.id)).toEqual([
      "address-polygon",
      "address-ethereum",
    ]);
  });

  it("should publish a non-empty local state when the distant slot is absent", () => {
    const result = contactsSyncModule.diffLocalToDistant(populatedContacts, null);

    expect(result.hasChanges).toBe(true);
    expect(result.nextState).toEqual(toWire(populatedContacts));
  });

  it("should preserve future fields when a local change is published", () => {
    const latest = toWire(populatedContacts);
    const distantWithFutureFields = {
      ...latest,
      rootFutureField: "preserved",
      me: {
        ...latest.me,
        meFutureField: "preserved",
        addresses: latest.me.addresses.map((address, index) =>
          index === 0 ? { ...address, addressFutureField: "preserved" } : address,
        ),
      },
      contactGroups: latest.contactGroups.map((contactGroup, index) =>
        index === 0 ? { ...contactGroup, contactFutureField: "preserved" } : contactGroup,
      ),
    };
    const local = [
      mockMeContactWithAddresses({ name: "Raphael" }),
      mockContact({ id: "contact-ada", name: "Ada" }),
    ];

    const result = contactsSyncModule.diffLocalToDistant(local, distantWithFutureFields);

    expect(result).toMatchObject({
      hasChanges: true,
      nextState: {
        rootFutureField: "preserved",
        me: { meFutureField: "preserved", name: "Raphael" },
      },
    });
    const nextState = ContactsDistantSchema.parse(result.nextState);
    expect((nextState.me.addresses[0] as Record<string, unknown>).addressFutureField).toBe(
      "preserved",
    );
    expect((nextState.contactGroups[0] as Record<string, unknown>).contactFutureField).toBe(
      "preserved",
    );
  });

  it("should preserve the raw distant state when known Contacts data is equal", () => {
    const distantWithFutureField = { ...toWire(populatedContacts), futureField: "preserved" };

    expect(
      contactsSyncModule.diffLocalToDistant(populatedContacts, distantWithFutureField),
    ).toEqual({
      hasChanges: false,
      nextState: distantWithFutureField,
    });
  });

  it("should publish an insertion-order change", () => {
    const local = [
      mockMeContact(),
      mockContact({ id: "contact-zed", name: "Zed" }),
      mockContact({ id: "contact-ada", name: "Ada" }),
    ];
    const distant = toWire(local);
    const reordered = [local[0]!, local[2]!, local[1]!];

    expect(contactsSyncModule.diffLocalToDistant(reordered, distant).hasChanges).toBe(true);
  });

  it("should keep an invalid distant payload untouched", () => {
    const invalid = {
      me: { name: "Me", addresses: [] },
      contactGroups: [{ id: "contact-me", name: "Ada", addresses: [] }],
    };

    expect(contactsSyncModule.diffLocalToDistant(populatedContacts, invalid)).toEqual({
      hasChanges: false,
      nextState: invalid,
    });
  });
});

describe("contactsSyncModule.resolveIncrementalUpdate", () => {
  it("should replace every local contact from a valid distant document", async () => {
    const incomingContacts = [
      mockMeContactWithAddresses({ name: "Raphael" }),
      mockContactWithMultipleAddresses({ id: "contact-ada", name: "Ada" }),
    ];

    await expect(
      contactsSyncModule.resolveIncrementalUpdate(
        mockEmptyContacts(),
        null,
        toWire(incomingContacts),
      ),
    ).resolves.toEqual({ hasChanges: true, update: incomingContacts });
  });

  it("should not apply a different reference with equivalent known data", async () => {
    const distantCopy = JSON.parse(JSON.stringify(toWire(populatedContacts))) as unknown;

    await expect(
      contactsSyncModule.resolveIncrementalUpdate(populatedContacts, null, distantCopy),
    ).resolves.toEqual({ hasChanges: false });
  });

  it("should ignore invalid or unsigned distant data atomically", async () => {
    const address = mockContactAddress();
    const invalidDistantStates: unknown[] = [
      [],
      {
        me: { name: "Me", addresses: [address] },
        contactGroups: [],
      },
      {
        me: { name: "Me", addresses: [] },
        contactGroups: [
          { id: "contact-ada", name: "Ada", addresses: [] },
          { id: "contact-ada", name: "Ada", addresses: [] },
        ],
      },
    ];

    for (const incoming of invalidDistantStates) {
      await expect(
        contactsSyncModule.resolveIncrementalUpdate(populatedContacts, null, incoming),
      ).resolves.toEqual({ hasChanges: false });
    }
  });

  it("should reject reserved local role fields in the distant document", async () => {
    const rawMeId = {
      me: { id: "contact-me", name: "Me", addresses: [] },
      contactGroups: [],
    };
    const rawContactGroupRole = {
      me: { name: "Me", addresses: [] },
      contactGroups: [{ id: "contact-ada", isMe: false, name: "Ada", addresses: [] }],
    };

    await expect(
      contactsSyncModule.resolveIncrementalUpdate(populatedContacts, null, rawMeId),
    ).resolves.toEqual({ hasChanges: false });
    await expect(
      contactsSyncModule.resolveIncrementalUpdate(populatedContacts, null, rawContactGroupRole),
    ).resolves.toEqual({ hasChanges: false });
  });

  it("should not apply the same distant state reference", async () => {
    const distant = toWire(populatedContacts);

    await expect(
      contactsSyncModule.resolveIncrementalUpdate(mockEmptyContacts(), distant, distant),
    ).resolves.toEqual({ hasChanges: false });
  });
});

describe("contactsSyncModule.applyUpdate", () => {
  it("should replace Contacts without mutating frozen local data", async () => {
    const local = Object.freeze(mockEmptyContacts()) as Contact[];
    const incoming = [
      mockMeContactWithAddresses(),
      mockContact({ id: "contact-ada", name: "Ada" }),
    ];
    const resolution = await contactsSyncModule.resolveIncrementalUpdate(
      local,
      null,
      toWire(incoming),
    );

    expect(resolution.hasChanges).toBe(true);
    if (resolution.hasChanges) {
      expect(contactsSyncModule.applyUpdate(local, resolution.update)).toEqual(incoming);
    }
    expect(local).toEqual(mockEmptyContacts());
  });
});

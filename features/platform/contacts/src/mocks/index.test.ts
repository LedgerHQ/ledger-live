import {
  mockContact,
  mockContactAddress,
  mockContactWithMultipleAddresses,
  mockMeContact,
} from "@domain/entity-contact/schema.mock";
import { createMockContactsPlatform } from ".";

describe("createMockContactsPlatform", () => {
  it("adds Me to a custom list and loads its detail", async () => {
    const platform = createMockContactsPlatform({
      contacts: [mockContact({ id: "contact-olive", name: "Olive" })],
    });

    const list = await platform.list.loadContactsList();
    const detail = await platform.detail.loadContactDetail(list.me.id);

    expect(list).toMatchObject({
      me: { isMe: true, addressCount: 0 },
      contacts: [{ name: "Olive" }],
      status: "results",
    });
    expect(detail.contact).toMatchObject({ id: list.me.id, isMe: true });
  });

  it("returns no results for an unmatched search and an empty state when only Me exists", async () => {
    const platform = createMockContactsPlatform();
    const onlyMePlatform = createMockContactsPlatform({ contacts: [mockMeContact()] });

    await expect(platform.list.loadContactsList("missing")).resolves.toMatchObject({
      contacts: [],
      status: "no-results",
    });
    await expect(onlyMePlatform.list.loadContactsList()).resolves.toMatchObject({
      status: "empty",
    });
  });

  it("creates a contact without addresses", async () => {
    const platform = createMockContactsPlatform();

    const firstContact = await platform.create.createContact({ name: "Olivia" });
    const secondContact = await platform.create.createContact({ name: "Olivia" });

    expect(firstContact).toMatchObject({
      id: "contact-olivia",
      isMe: false,
      name: "Olivia",
      addresses: [],
    });
    expect(secondContact.id).toBe("contact-olivia-2");
  });

  it("loads supported currencies and applies a confirmed address registration", async () => {
    const oliveContact = mockContact({ id: "contact-olive", name: "Olive" });
    const platform = createMockContactsPlatform({ contacts: [oliveContact] });

    await expect(
      platform.addAddress.loadSupportedAddressCurrencyIds(oliveContact.id),
    ).resolves.toEqual(["ethereum", "polygon", "ethereum/erc20/usd-tether"]);

    const validation = await platform.addAddress.validateAddressCandidate({
      contactId: oliveContact.id,
      currencyId: "ethereum",
      label: "Ethereum",
      address: "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
    });

    expect(validation.type).toBe("valid");

    if (validation.type !== "valid") {
      throw new Error("Expected a valid address candidate");
    }

    const draft = await platform.addAddress.prepareAddressRegistration(validation.candidate);
    const detail = await platform.addAddress.applyConfirmedAddressRegistration({
      draft,
      confirmationId: "confirmation-1",
    });

    expect(detail.contact.addresses).toHaveLength(1);
    expect(detail.contact.addresses[0]).toMatchObject({ currencyId: "ethereum" });
  });

  it("sorts contact detail addresses by network", async () => {
    const contactWithAddresses = mockContact({
      id: "contact-network-sorted",
      name: "Network sorted",
      addresses: [
        mockContactAddress({
          id: "address-polygon",
          currencyId: "polygon",
          label: "Polygon",
          address: "0x2ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
        }),
        mockContactAddress({
          id: "address-usdt-ethereum",
          currencyId: "ethereum/erc20/usd-tether",
          label: "USDT",
          address: "0x3ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
        }),
        mockContactAddress({
          id: "address-ethereum",
          currencyId: "ethereum",
          label: "Ethereum",
          address: "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
        }),
      ],
    });
    const platform = createMockContactsPlatform({ contacts: [contactWithAddresses] });

    const detail = await platform.detail.loadContactDetail(contactWithAddresses.id);

    expect(detail.contact.addresses.map(address => address.currencyId)).toEqual([
      "ethereum",
      "ethereum/erc20/usd-tether",
      "polygon",
    ]);
  });

  it("rejects unsupported currencies, blank addresses, and invalid labels", async () => {
    const contactId = mockContact({ id: "contact-ben", name: "Ben" }).id;
    const platform = createMockContactsPlatform();

    await expect(
      platform.addAddress.validateAddressCandidate({
        contactId,
        currencyId: "tron",
        label: "TRON",
        address: "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
      }),
    ).resolves.toEqual({ type: "invalid", reason: "unsupported-currency" });
    await expect(
      platform.addAddress.validateAddressCandidate({
        contactId,
        currencyId: "ethereum",
        label: "Ethereum",
        address: "   ",
      }),
    ).resolves.toEqual({ type: "invalid", reason: "invalid-address-format" });
    await expect(
      platform.addAddress.validateAddressCandidate({
        contactId,
        currencyId: "ethereum",
        label: "Ethé",
        address: "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
      }),
    ).resolves.toEqual({ type: "invalid", reason: "invalid-label" });
  });

  it("renames contacts and requires confirmation when a contact has an address", async () => {
    const emptyContact = mockContact({ id: "contact-empty", name: "Empty" });
    const contactWithAddress = mockContactWithMultipleAddresses({
      id: "contact-with-address",
      name: "With address",
    });
    const platform = createMockContactsPlatform({
      contacts: [emptyContact, contactWithAddress],
    });

    await expect(platform.editContact.getContactEditRequirement(emptyContact.id)).resolves.toEqual({
      type: "direct",
      reason: "contact-has-no-address",
    });
    await expect(
      platform.editContact.getContactEditRequirement(contactWithAddress.id),
    ).resolves.toEqual({
      type: "confirmation-required",
      reason: "contact-has-address",
    });
    await expect(
      platform.editContact.renameContact({ contactId: emptyContact.id, name: "Renamed" }),
    ).resolves.toMatchObject({ name: "Renamed" });
  });

  it("gates mutations when Ledger Sync is disabled", async () => {
    const platform = createMockContactsPlatform({ ledgerSyncEnabled: false });

    await expect(
      platform.ledgerSyncGate.checkContactsMutationAllowed("add-address"),
    ).resolves.toEqual({
      type: "blocked",
      reason: "ledger-sync-disabled",
      intendedAction: "add-address",
    });
  });

  it("applies a confirmed address edit", async () => {
    const contactWithAddress = mockContactWithMultipleAddresses({
      id: "contact-with-address",
      name: "With address",
    });
    const platform = createMockContactsPlatform({ contacts: [contactWithAddress] });
    const address = contactWithAddress.addresses[0];

    if (!address) {
      throw new Error("Expected contact to have an address");
    }

    const draft = await platform.editAddress.prepareAddressEdit({
      contactId: contactWithAddress.id,
      addressId: address.id,
      label: "ETH Vault",
    });
    const detail = await platform.editAddress.applyConfirmedAddressEdit({
      draft,
      confirmationId: "confirmation-1",
    });

    expect(detail.contact.addresses.find(item => item.id === address.id)).toMatchObject({
      label: "ETH Vault",
    });
  });

  it("collects tracking events without sending them", () => {
    const platform = createMockContactsPlatform();

    platform.tracking.trackContactsEvent({
      name: "contacts-entry-opened",
      properties: { contacts_count: 3 },
    });

    expect(platform.trackedEvents).toEqual([
      {
        name: "contacts-entry-opened",
        properties: { contacts_count: 3 },
      },
    ]);
  });
});

import {
  ContactAddressLabelSchema,
  ContactAddressSchema,
  ContactCurrencyIdSchema,
  ContactEvmAddressSchema,
  ContactSchema,
} from "./schema";
import {
  mockContact,
  mockContactAddress,
  mockContactWithAddress,
  mockContactWithMultipleAddresses,
  mockEmptyContacts,
  mockMeContact,
  mockPopulatedContacts,
} from "./schema.mock";

describe("ContactSchema", () => {
  it("parses the self contact used by Me screens", () => {
    const contact = mockMeContact();

    expect(ContactSchema.parse(contact)).toEqual(contact);
    expect(contact.isMe).toBe(true);
    expect(contact.name).toBe("Me");
    expect(contact.addresses).toHaveLength(0);
  });

  it("parses a regular contact", () => {
    const contact = mockContact();

    expect(ContactSchema.parse(contact)).toEqual(contact);
    expect(contact.isMe).toBe(false);
  });

  it("rejects a contact without a name", () => {
    expect(() => ContactSchema.parse(mockContact({ name: "   " }))).toThrow();
  });
});

describe("ContactAddressSchema", () => {
  it("parses an EVM contact address", () => {
    const address = mockContactAddress();

    expect(ContactAddressSchema.parse(address)).toEqual(address);
    expect(address.currencyId).toBe("ethereum");
  });

  it("parses a token currency id selected through MAD", () => {
    expect(ContactCurrencyIdSchema.parse("ethereum/erc20/usd-tether")).toBe(
      "ethereum/erc20/usd-tether",
    );
  });

  it("parses a crypto currency id selected through MAD", () => {
    expect(ContactCurrencyIdSchema.parse("ethereum")).toBe("ethereum");
  });

  it("rejects non-EVM address format", () => {
    expect(() => ContactEvmAddressSchema.parse("not-an-address")).toThrow();
  });

  it("rejects non-ASCII address labels", () => {
    expect(() => ContactAddressLabelSchema.parse("Ethér")).toThrow();
  });
});

describe("contact mock factories", () => {
  it("builds a contact with one address", () => {
    const contact = mockContactWithAddress();

    expect(ContactSchema.parse(contact)).toEqual(contact);
    expect(contact.addresses).toHaveLength(1);
    expect(contact.addresses[0]?.currencyId).toBe("ethereum");
  });

  it("builds a contact with multiple addresses", () => {
    const contact = mockContactWithMultipleAddresses();

    expect(ContactSchema.parse(contact)).toEqual(contact);
    expect(contact.addresses.map(address => address.currencyId)).toEqual(["polygon", "ethereum"]);
  });

  it("builds empty and populated contact lists", () => {
    expect(mockEmptyContacts()).toEqual([mockMeContact()]);

    const contacts = mockPopulatedContacts();

    expect(contacts.map(contact => contact.name)).toEqual(["Me", "Ada", "Ben", "Olive"]);
    expect(contacts[2]?.addresses).toHaveLength(2);
  });
});

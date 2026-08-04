import {
  ContactAddressLabelInputSchema,
  ContactAddressLabelSchema,
  ContactAddressSchema,
  ContactAddressValueSchema,
  ContactCurrencyIdSchema,
  ContactNameInputSchema,
  ContactNameSchema,
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

  it("accepts international contact names", () => {
    expect(ContactNameInputSchema.parse(" E\u0301lodie ")).toBe("Élodie");
    expect(ContactNameSchema.parse("Jean-Luc O'Connor")).toBe(
      "Jean-Luc O'Connor"
    );
    expect(ContactNameSchema.parse("Алексей")).toBe("Алексей");
    expect(ContactNameSchema.parse("مريم")).toBe("مريم");
  });

  it("rejects unsupported contact name characters", () => {
    expect(() => ContactNameSchema.parse("\u0301")).toThrow();
    expect(() => ContactNameSchema.parse("Olive2")).toThrow();
    expect(() => ContactNameSchema.parse("Olive 💎")).toThrow();
    expect(() => ContactNameSchema.parse("Olive@")).toThrow();
  });
});

describe("ContactAddressSchema", () => {
  it("parses a contact address", () => {
    const address = mockContactAddress();

    expect(ContactAddressSchema.parse(address)).toEqual(address);
    expect(address.currencyId).toBe("ethereum");
  });

  it("keeps address format generic for the selected currency", () => {
    const address = mockContactAddress({
      currencyId: "solana",
      address: "So11111111111111111111111111111111111111112",
    });

    expect(ContactAddressSchema.parse(address)).toEqual(address);
  });

  it("parses a token currency id selected through MAD", () => {
    expect(ContactCurrencyIdSchema.parse("ethereum/erc20/usd-tether")).toBe(
      "ethereum/erc20/usd-tether"
    );
  });

  it("parses a crypto currency id selected through MAD", () => {
    expect(ContactCurrencyIdSchema.parse("ethereum")).toBe("ethereum");
  });

  it("rejects empty addresses", () => {
    expect(() => ContactAddressValueSchema.parse("   ")).toThrow();
  });

  it("accepts printable ASCII address labels", () => {
    expect(ContactAddressLabelSchema.parse("Aave v3 1INCH")).toBe(
      "Aave v3 1INCH"
    );
    expect(ContactAddressLabelSchema.parse("USDC.e")).toBe("USDC.e");
    expect(ContactAddressLabelSchema.parse("123")).toBe("123");
  });

  it("normalizes address label input before applying the entity schema", () => {
    expect(ContactAddressLabelInputSchema.parse("  Ethereum  ")).toBe(
      "Ethereum"
    );
    expect(ContactAddressLabelInputSchema.parse("   ")).toBe("");
  });

  it("rejects non-ASCII, punctuation-only, emoji, and control-character address labels", () => {
    expect(() => ContactAddressLabelSchema.parse("Ethér")).toThrow();
    expect(() => ContactAddressLabelSchema.parse(" محفظة ")).toThrow();
    expect(() => ContactAddressLabelSchema.parse("Кошелек")).toThrow();
    expect(() => ContactAddressLabelSchema.parse("---")).toThrow();
    expect(() => ContactAddressLabelSchema.parse("Ethereum 💎")).toThrow();
    expect(() =>
      ContactAddressLabelSchema.parse("Ethereum 1\uFE0F\u20E3")
    ).toThrow();
    expect(() => ContactAddressLabelSchema.parse("Ethereum\nWallet")).toThrow();
  });

  it("rejects address labels longer than 32 characters", () => {
    expect(() => ContactAddressLabelSchema.parse("a".repeat(33))).toThrow();
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
    expect(contact.addresses.map((address) => address.currencyId)).toEqual([
      "polygon",
      "ethereum",
    ]);
  });

  it("builds empty and populated contact lists", () => {
    expect(mockEmptyContacts()).toEqual([mockMeContact()]);

    const contacts = mockPopulatedContacts();

    expect(contacts.map((contact) => contact.name)).toEqual([
      "Me",
      "Ada",
      "Ben",
      "Charlie",
      "Diana",
      "Olive",
    ]);
    expect(contacts[0]?.addresses).toHaveLength(3);
    expect(contacts[2]?.addresses).toHaveLength(2);
  });
});

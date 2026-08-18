import { getRecipientHeaderPresentation } from "../getRecipientHeaderPresentation";
import type { Contact } from "../findMatchedContact";

const ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";
const FORMATTED_ADDRESS = "0x123456...12345678";

const contacts: readonly Contact[] = [
  {
    id: "contact-benoit",
    isMe: false,
    name: "Benoit Jean",
    addresses: [{ id: "address-1", currencyId: "ethereum", label: "Eth main", address: ADDRESS }],
  },
];

const baseArgs = {
  recipient: { address: ADDRESS },
  contacts,
  currencyId: "ethereum",
  isContactsFeatureEnabled: true,
};

describe("getRecipientHeaderPresentation", () => {
  it("should return the contact when the address belongs to a contact", () => {
    expect(getRecipientHeaderPresentation(baseArgs)).toEqual({
      label: "Benoit Jean",
      contact: { id: "contact-benoit", name: "Benoit Jean" },
    });
  });

  it("should prefer the contact over the ENS name", () => {
    expect(
      getRecipientHeaderPresentation({
        ...baseArgs,
        recipient: { address: ADDRESS, ensName: "vitalik.eth" },
      }).label,
    ).toBe("Benoit Jean");
  });

  it("should fall back to the formatted address when no contact matches", () => {
    expect(getRecipientHeaderPresentation({ ...baseArgs, contacts: [] })).toEqual({
      label: FORMATTED_ADDRESS,
      contact: undefined,
    });
  });

  it("should fall back to the formatted address when the contacts feature is disabled", () => {
    expect(
      getRecipientHeaderPresentation({ ...baseArgs, isContactsFeatureEnabled: false }),
    ).toEqual({ label: FORMATTED_ADDRESS, contact: undefined });
  });

  it("should fall back to the formatted address when the currency is unknown", () => {
    expect(getRecipientHeaderPresentation({ ...baseArgs, currencyId: undefined })).toEqual({
      label: FORMATTED_ADDRESS,
      contact: undefined,
    });
  });

  it("should return an empty label for a null recipient", () => {
    expect(getRecipientHeaderPresentation({ ...baseArgs, recipient: null })).toEqual({
      label: "",
      contact: undefined,
    });
  });
});

import {
  ContactAddressLabelTooLongError,
  DuplicateContactAddressLabelError,
  InvalidContactAddressLabelError,
  InvalidContactNameError,
} from "./errors";
import {
  CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_NAME_ERROR_NAME,
  getContactAddressLabelValidationError,
  getContactNameValidationError,
  isValidContactAddressLabel,
  isValidContactName,
  normalizeContactAddressLabelForComparison,
  parseContactAddressLabel,
  parseContactName,
} from "./validation";
import {
  ContactAddressLabelInputSchema,
  ContactAddressLabelSchema,
} from "./schema";

describe("contact name validation", () => {
  it("does not report an error for an empty draft name", () => {
    expect(getContactNameValidationError("")).toBeNull();
    expect(getContactNameValidationError("   ")).toBeNull();
  });

  it("does not report an error for a valid draft name", () => {
    expect(getContactNameValidationError("Ben")).toBeNull();
  });

  it("reports the stable InvalidContactNameError name for a non-empty invalid draft name", () => {
    expect(getContactNameValidationError("Olive2")).toBe(
      INVALID_CONTACT_NAME_ERROR_NAME
    );
  });

  it("validates trimmed names consistently", () => {
    expect(isValidContactName("  Ben  ")).toBe(true);
    expect(isValidContactName("Olive2")).toBe(false);
    expect(isValidContactName("")).toBe(false);
  });

  it("parseContactName throws InvalidContactNameError for an invalid draft name", () => {
    expect(() => parseContactName("Olive2")).toThrow(InvalidContactNameError);
  });

  it("parseContactName returns a parsed name for a valid draft name", () => {
    expect(parseContactName("  Ben  ")).toBe("Ben");
  });
});

describe("contact address label validation", () => {
  it("does not report an error for an empty draft label", () => {
    expect(getContactAddressLabelValidationError("")).toBeNull();
    expect(getContactAddressLabelValidationError("   ")).toBeNull();
    expect(isValidContactAddressLabel("")).toBe(false);
  });

  it("rejects an address label longer than 32 characters", () => {
    const longLabel = "Ethereum ".repeat(50);

    expect(getContactAddressLabelValidationError("Ethereum")).toBeNull();
    expect(getContactAddressLabelValidationError(longLabel)).toBe(
      CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME
    );
    expect(isValidContactAddressLabel(longLabel)).toBe(false);
  });

  it("ignores surrounding whitespace when checking the address label length", () => {
    const labelWithWhitespace = `  ${"a".repeat(32)}  `;

    expect(
      getContactAddressLabelValidationError(labelWithWhitespace)
    ).toBeNull();
    expect(parseContactAddressLabel(labelWithWhitespace)).toBe("a".repeat(32));
  });

  it("reports invalid non-ASCII characters for a non-empty draft label", () => {
    expect(getContactAddressLabelValidationError("Ethér")).toBe(
      INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME
    );
    expect(isValidContactAddressLabel("Ethér")).toBe(false);
  });

  it("reports a duplicate within the existing labels", () => {
    const existingLabels = [ContactAddressLabelSchema.parse("Ethereum")];

    expect(
      getContactAddressLabelValidationError(" ethereum ", existingLabels)
    ).toBe(DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME);
    expect(isValidContactAddressLabel("ETHEREUM", existingLabels)).toBe(false);
  });

  it("normalizes ASCII labels for comparison", () => {
    expect(
      normalizeContactAddressLabelForComparison(
        ContactAddressLabelInputSchema.parse(" Ethereum ")
      )
    ).toBe(
      normalizeContactAddressLabelForComparison(
        ContactAddressLabelInputSchema.parse("ETHEREUM")
      )
    );
  });

  it("parses and normalizes a valid address label", () => {
    expect(parseContactAddressLabel("  Ethereum  ")).toBe("Ethereum");
  });

  it("throws the matching domain error for invalid and duplicate labels", () => {
    const existingLabels = [ContactAddressLabelSchema.parse("Ethereum")];

    expect(() => parseContactAddressLabel("Ethereum 💎")).toThrow(
      InvalidContactAddressLabelError
    );
    expect(() => parseContactAddressLabel("ethereum", existingLabels)).toThrow(
      DuplicateContactAddressLabelError
    );
    expect(() => parseContactAddressLabel("Ethereum ".repeat(50))).toThrow(
      ContactAddressLabelTooLongError
    );
  });
});

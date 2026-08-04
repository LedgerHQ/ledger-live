import {
  ContactAddressLabelTooLongError,
  DuplicateContactAddressLabelError,
  DuplicateContactNameError,
  InvalidContactAddressLabelError,
  InvalidContactNameError,
} from "./errors";
import {
  ContactAddressLabelInputSchema,
  ContactAddressLabelSchema,
  ContactNameSchema,
} from "./schema";
import {
  CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  DUPLICATE_CONTACT_NAME_ERROR_NAME,
  getContactAddressLabelValidationError,
  getContactNameValidationError,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_NAME_ERROR_NAME,
  isValidContactAddressLabel,
  isValidContactName,
  normalizeContactAddressLabelForComparison,
  normalizeContactNameForComparison,
  parseContactAddressLabel,
  parseContactName,
} from "./validation";

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

  it("reports a duplicate name after trimming, normalizing, and folding case", () => {
    const existingNames = [ContactNameSchema.parse("Élodie")];

    expect(getContactNameValidationError(" e\u0301LODIE ", existingNames)).toBe(
      DUPLICATE_CONTACT_NAME_ERROR_NAME
    );
    expect(isValidContactName(" e\u0301LODIE ", existingNames)).toBe(false);
    expect(normalizeContactNameForComparison(" Élodie ")).toBe(
      normalizeContactNameForComparison("e\u0301LODIE")
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

  it("parseContactName throws DuplicateContactNameError for an existing name", () => {
    const existingNames = [ContactNameSchema.parse("Ada")];

    expect(() => parseContactName(" ada ", existingNames)).toThrow(
      DuplicateContactNameError
    );
  });

  it("parseContactName returns a parsed name for a valid draft name", () => {
    expect(parseContactName("  Ben  ")).toBe("Ben");
  });

  it("parseContactName returns a NFC-normalized name", () => {
    expect(parseContactName(" E\u0301lodie ")).toBe("Élodie");
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

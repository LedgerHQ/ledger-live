import {
  DuplicateContactAddressLabelError,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  InvalidContactAddressLabelError,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  InvalidContactNameError,
  INVALID_CONTACT_NAME_ERROR_NAME,
} from "./errors";
import { ContactAddressLabelSchema } from "./schema";
import {
  getContactAddressLabelValidationError,
  getContactNameValidationError,
  isValidContactAddressLabel,
  isValidContactName,
  normalizeContactAddressLabelForComparison,
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
    expect(getContactNameValidationError("Olive2")).toBe(INVALID_CONTACT_NAME_ERROR_NAME);
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

  it("accepts a valid draft label without imposing a length limit", () => {
    const longLabel = "Ethereum ".repeat(50);

    expect(getContactAddressLabelValidationError("Ethereum")).toBeNull();
    expect(isValidContactAddressLabel(longLabel)).toBe(true);
  });

  it("reports invalid non-ASCII characters for a non-empty draft label", () => {
    expect(getContactAddressLabelValidationError("Ethér")).toBe(
      INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
    );
    expect(isValidContactAddressLabel("Ethér")).toBe(false);
  });

  it("reports a duplicate within the existing labels", () => {
    const existingLabels = [ContactAddressLabelSchema.parse("Ethereum")];

    expect(getContactAddressLabelValidationError(" ethereum ", existingLabels)).toBe(
      DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
    );
    expect(isValidContactAddressLabel("ETHEREUM", existingLabels)).toBe(false);
  });

  it("normalizes ASCII labels for comparison", () => {
    expect(normalizeContactAddressLabelForComparison(" Ethereum ")).toBe(
      normalizeContactAddressLabelForComparison("ETHEREUM"),
    );
  });

  it("parses and normalizes a valid address label", () => {
    expect(parseContactAddressLabel("  Ethereum  ")).toBe("Ethereum");
  });

  it("throws the matching domain error for invalid and duplicate labels", () => {
    const existingLabels = [ContactAddressLabelSchema.parse("Ethereum")];

    expect(() => parseContactAddressLabel("Ethereum 💎")).toThrow(InvalidContactAddressLabelError);
    expect(() => parseContactAddressLabel("ethereum", existingLabels)).toThrow(
      DuplicateContactAddressLabelError,
    );
  });
});

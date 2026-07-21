import { InvalidContactNameError, INVALID_CONTACT_NAME_ERROR_NAME } from "./errors";
import { getContactNameValidationError, isValidContactName, parseContactName } from "./validation";

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

import { mockContact, mockMeContact } from "@domain/entity-contact/schema.mock";
import { createMeDisplayNameFormatter } from "./formatMeDisplayName";
import { resolveMeContactDisplayName } from "./resolveMeContactDisplayName";

const formatMeDisplayName = createMeDisplayNameFormatter("My addresses", name => `${name} (Me)`);

describe("resolveMeContactDisplayName", () => {
  it("should return the contact name for saved contacts", () => {
    expect(resolveMeContactDisplayName(mockContact({ name: "Ada" }), formatMeDisplayName)).toBe(
      "Ada",
    );
  });

  it("should return the default Me label when the self contact still uses the default name", () => {
    expect(resolveMeContactDisplayName(mockMeContact(), formatMeDisplayName)).toBe("My addresses");
  });

  it("should format a custom self-contact name", () => {
    expect(
      resolveMeContactDisplayName(mockMeContact({ name: "Maxime" }), formatMeDisplayName),
    ).toBe("Maxime (Me)");
  });
});

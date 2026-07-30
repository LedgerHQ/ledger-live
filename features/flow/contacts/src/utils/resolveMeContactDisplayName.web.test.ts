import { mockContact, mockMeContact } from "@domain/entity-contact/schema.mock";
import { resolveMeContactDisplayName } from "./resolveMeContactDisplayName";

const formatWithMeSuffix = (name: string) => `${name} (Me)`;

describe("resolveMeContactDisplayName", () => {
  it("should return the contact name for saved contacts", () => {
    expect(
      resolveMeContactDisplayName(mockContact({ name: "Ada" }), formatWithMeSuffix),
    ).toBe("Ada");
  });

  it("should return Me when the self contact still uses the default name", () => {
    expect(resolveMeContactDisplayName(mockMeContact(), formatWithMeSuffix)).toBe("Me");
  });

  it("should append the Me suffix when the self contact has a custom name", () => {
    expect(
      resolveMeContactDisplayName(mockMeContact({ name: "Maxime" }), formatWithMeSuffix),
    ).toBe("Maxime (Me)");
  });
});

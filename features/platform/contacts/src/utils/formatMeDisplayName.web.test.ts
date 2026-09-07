import { createMeDisplayNameFormatter, identityFormatMeDisplayName } from "./formatMeDisplayName";

const formatCustomName = (name: string) => `${name} (Me)`;

describe("createMeDisplayNameFormatter", () => {
  const formatMeDisplayName = createMeDisplayNameFormatter("My addresses", formatCustomName);

  it("should return the default label when the stored name is Me", () => {
    expect(formatMeDisplayName("Me")).toBe("My addresses");
  });

  it("should format a custom Me name", () => {
    expect(formatMeDisplayName("Maxime")).toBe("Maxime (Me)");
  });
});

describe("identityFormatMeDisplayName", () => {
  it("should return the stored name unchanged", () => {
    expect(identityFormatMeDisplayName("Me")).toBe("Me");
  });
});

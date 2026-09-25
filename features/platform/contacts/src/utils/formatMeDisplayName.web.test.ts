import { createMeDisplayNameFormatter, identityFormatMeDisplayName } from "./formatMeDisplayName";

const formatName = (name: string) => `${name} (Me)`;

describe("createMeDisplayNameFormatter", () => {
  const formatMeDisplayName = createMeDisplayNameFormatter("My addresses", formatName);

  it("should suffix the default label when the stored name is Me", () => {
    expect(formatMeDisplayName("Me")).toBe("My addresses (Me)");
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

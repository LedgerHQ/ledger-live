import { extractHardwareCarouselDevice } from "./extractHardwareCarouselDevice";

describe("extractHardwareCarouselDevice", () => {
  it.each([
    { title: "Ledger Gen5", expected: "ledger gen5" },
    { title: "Nano Pod", expected: "ledger gen5" },
    { title: "Ledger Flex™", expected: "ledger flex" },
    { title: "Ledger Stax", expected: "ledger stax" },
  ])("maps $title to $expected", ({ title, expected }) => {
    expect(extractHardwareCarouselDevice(title)).toBe(expected);
  });

  it("returns null for unknown titles", () => {
    expect(extractHardwareCarouselDevice("Nano Case")).toBeNull();
  });
});

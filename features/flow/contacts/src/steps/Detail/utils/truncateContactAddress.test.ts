import { truncateContactAddress } from "./truncateContactAddress";

describe("truncateContactAddress", () => {
  it("returns short addresses unchanged", () => {
    expect(truncateContactAddress("0x1234")).toBe("0x1234");
  });

  it("returns addresses up to the truncation length unchanged", () => {
    const address = "0x1234567890123456789";

    expect(address).toHaveLength(19);
    expect(truncateContactAddress(address)).toBe(address);
  });

  it("truncates addresses longer than the truncation length", () => {
    const address = "0x12345678901234567890";

    expect(address).toHaveLength(20);
    expect(truncateContactAddress(address)).toBe("0x123456...34567890");
  });

  it("truncates long addresses with ellipsis", () => {
    expect(truncateContactAddress("0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034")).toBe(
      "0x1ad23b...46c53034",
    );
  });
});

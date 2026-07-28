import { truncateContactAddress } from "./truncateContactAddress";

describe("truncateContactAddress", () => {
  it("returns short addresses unchanged", () => {
    expect(truncateContactAddress("0x1234")).toBe("0x1234");
  });

  it("truncates long addresses with ellipsis", () => {
    expect(truncateContactAddress("0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034")).toBe(
      "0x1ad23b...46c53034",
    );
  });
});

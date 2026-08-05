import { createContactAddress } from "./define";

describe("createContactAddress", () => {
  it("creates a valid contact address with a generated identifier", () => {
    expect(
      createContactAddress({
        currencyId: "ethereum",
        label: "Exchange",
        address: "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
      }),
    ).toEqual({
      id: expect.stringMatching(/^address-/),
      currencyId: "ethereum",
      label: "Exchange",
      address: "0x1ad23b2cf8d2e0591ea417eb82f7cd9746c53034",
    });
  });
});

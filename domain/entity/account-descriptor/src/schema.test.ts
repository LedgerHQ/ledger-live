import { AccountDescriptorSchema } from "./schema";
import { mockAddressAccountDescriptor, mockUtxoAccountDescriptor } from "./schema.mock";

describe("AccountDescriptorSchema", () => {
  it.each([mockUtxoAccountDescriptor(), mockAddressAccountDescriptor()])(
    "accepts a valid $type descriptor",
    descriptor => {
      expect(AccountDescriptorSchema.parse(descriptor)).toEqual(descriptor);
    },
  );

  it.each([
    ["an empty address", { address: "" }],
    ["a purpose other than account", { purpose: "contact" }],
    ["an unknown version", { version: "2" }],
    ["an unknown type", { type: "multisig" }],
    ["an empty network name", { network: { name: "", env: "main" } }],
  ])("rejects %s", (_, overrides) => {
    expect(
      AccountDescriptorSchema.safeParse({ ...mockAddressAccountDescriptor(), ...overrides })
        .success,
    ).toBe(false);
  });

  it("rejects an empty xpub", () => {
    expect(
      AccountDescriptorSchema.safeParse({ ...mockUtxoAccountDescriptor(), xpub: "" }).success,
    ).toBe(false);
  });

  it.each(["m/84h/0h/0", "m/84/0h/0h", "m/084h/0h/0h", "m/2147483648h/0h/0h"])(
    "rejects the UTXO path %s",
    path => {
      expect(
        AccountDescriptorSchema.safeParse({ ...mockUtxoAccountDescriptor(), path }).success,
      ).toBe(false);
    },
  );

  it("accepts the 2^31 - 1 boundary index", () => {
    expect(
      AccountDescriptorSchema.safeParse(mockUtxoAccountDescriptor({ path: "m/2147483647h/0h/0h" }))
        .success,
    ).toBe(true);
  });
});

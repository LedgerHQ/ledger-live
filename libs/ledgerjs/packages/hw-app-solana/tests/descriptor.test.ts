import { buildDescriptor } from "../src/descriptor";

describe("Solana descriptor", () => {
  it("builds a descriptor", () => {
    expect(
      buildDescriptor({
        data: Buffer.from("000102030405", "hex"),
        signature: Buffer.from("060708090a0b", "hex"),
      }),
    ).toEqual(Buffer.from("0001020304050806060708090a0b", "hex"));
  });

  it("fails to restrict the signature size within 1 byte", () => {
    expect(() =>
      buildDescriptor({
        data: Buffer.from("000102030405", "hex"),
        signature: Buffer.from(new Uint8Array(256)),
      }),
    ).toThrow("Value length exceeds 255 bytes");
  });
});

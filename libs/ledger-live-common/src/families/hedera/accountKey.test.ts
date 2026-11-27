import { hederaAccountKey } from "./accountKey";

const publicKey = "f381f94b116a99518739e1bb394d1c8de281055d48b01dbc1625eebb06021ce5";

describe("hederaAccountKey", () => {
  it("holds the account id and the device public key", () => {
    expect(
      hederaAccountKey.keyOf({ freshAddress: "0.0.10096335", seedIdentifier: publicKey }),
    ).toBe(`0.0.10096335:${publicKey}`);
  });

  it("writes the public key in lowercase", () => {
    expect(
      hederaAccountKey.keyOf({ freshAddress: "0.0.1", seedIdentifier: publicKey.toUpperCase() }),
    ).toBe(`0.0.1:${publicKey}`);
  });

  it.each(["0.0.10096335", "", undefined])("has no key for the seed identifier %p", id => {
    expect(
      hederaAccountKey.keyOf({ freshAddress: "0.0.10096335", seedIdentifier: id }),
    ).toBeUndefined();
  });

  it("gives the account id and the public key back", () => {
    expect(hederaAccountKey.partsOf(`0.0.10096335:${publicKey}`)).toEqual({
      freshAddress: "0.0.10096335",
      seedIdentifier: publicKey,
    });
  });

  it.each(["0.0.10096335", `0.0.1:${publicKey}:extra`, `not-an-id:${publicKey}`, "0.0.1:0.0.1"])(
    "does not read %p as a key",
    key => {
      expect(hederaAccountKey.partsOf(key)).toBeUndefined();
    },
  );
});

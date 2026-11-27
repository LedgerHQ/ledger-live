import { hederaLegacyAccountContext } from "./legacyAccountContext";

const publicKey = "f381f94b116a99518739e1bb394d1c8de281055d48b01dbc1625eebb06021ce5";

describe("hederaLegacyAccountContext", () => {
  it("keeps the public key as the seed identifier of the legacy account", () => {
    expect(hederaLegacyAccountContext.toLegacyFields({ publicKey })).toEqual({
      seedIdentifier: publicKey,
    });
  });

  it("reads the seed identifier back as the public key", () => {
    expect(hederaLegacyAccountContext.fromLegacyFields({ seedIdentifier: publicKey })).toEqual({
      publicKey,
    });
  });

  it.each(["0.0.10096335", "", undefined])("has no context for the seed identifier %p", id => {
    expect(hederaLegacyAccountContext.fromLegacyFields({ seedIdentifier: id })).toBeUndefined();
  });
});

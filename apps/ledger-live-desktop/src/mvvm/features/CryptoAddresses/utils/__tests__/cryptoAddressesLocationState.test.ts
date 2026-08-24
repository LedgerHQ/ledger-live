import { parseCryptoAddressesBackPath } from "../cryptoAddressesLocationState";

describe("parseCryptoAddressesBackPath", () => {
  it("should ignore invalid or recursive location state", () => {
    expect(parseCryptoAddressesBackPath(undefined)).toBeUndefined();
    expect(parseCryptoAddressesBackPath(null)).toBeUndefined();
    expect(parseCryptoAddressesBackPath({})).toBeUndefined();
    expect(parseCryptoAddressesBackPath({ cryptoAddressesBackPath: "" })).toBeUndefined();
    expect(
      parseCryptoAddressesBackPath({ cryptoAddressesBackPath: "../contacts" }),
    ).toBeUndefined();
    expect(parseCryptoAddressesBackPath({ cryptoAddressesBackPath: "/cryptos" })).toBeUndefined();
  });

  it("should return the safe Contacts back path", () => {
    expect(parseCryptoAddressesBackPath({ cryptoAddressesBackPath: "/contacts" })).toBe(
      "/contacts",
    );
  });
});

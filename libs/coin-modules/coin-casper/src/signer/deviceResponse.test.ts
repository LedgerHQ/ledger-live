import { PublicKey } from "casper-js-sdk";
import { TEST_ADDRESSES } from "../__tests__/fixtures/addresses.fixture";
import { CasperGetAddrResponse } from "../types";
import { addressFromDeviceResponse, tagSignature } from "./deviceResponse";

const response = (overrides: Partial<CasperGetAddrResponse> = {}): CasperGetAddrResponse => ({
  errorMessage: "No errors",
  returnCode: 0x9000,
  publicKey: Buffer.from(TEST_ADDRESSES.SECP256K1.slice(2), "hex"),
  Address: "",
  ...overrides,
});

describe("addressFromDeviceResponse", () => {
  it("lowercases the address the device supplies", () => {
    expect(
      addressFromDeviceResponse(response({ Address: TEST_ADDRESSES.SECP256K1.toUpperCase() })),
    ).toBe(TEST_ADDRESSES.SECP256K1);
  });

  it("tags the public key with secp256k1 when the device supplies no address", () => {
    expect(addressFromDeviceResponse(response())).toBe(TEST_ADDRESSES.SECP256K1);
  });

  it("returns a value casper-js-sdk parses as a public key on both branches", () => {
    expect(() => PublicKey.fromHex(addressFromDeviceResponse(response()))).not.toThrow();
    expect(() =>
      PublicKey.fromHex(addressFromDeviceResponse(response({ Address: TEST_ADDRESSES.SECP256K1 }))),
    ).not.toThrow();
  });
});

describe("tagSignature", () => {
  it("prepends the secp256k1 tag byte", () => {
    const signatureRS = Buffer.alloc(64, 0xab);

    const tagged = tagSignature(signatureRS);

    expect(tagged).toHaveLength(130);
    expect(tagged).toBe(`02${signatureRS.toString("hex")}`);
  });
});

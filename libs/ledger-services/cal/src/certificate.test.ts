import { convertCertificateToDeviceData } from "./certificate";

jest.mock("@ledgerhq/live-network", () => ({ default: jest.fn() }), { virtual: true });
jest.mock("@ledgerhq/live-env", () => ({ getEnv: jest.fn() }), { virtual: true });

describe("convertCertificateToDeviceData", () => {
  it("should concatenate descriptor and signature with signature tag and length", () => {
    // GIVEN
    const descriptor = "0102030405";
    const signature = "aabbcc";

    // WHEN
    const result = convertCertificateToDeviceData({ descriptor, signature });

    // THEN
    const expected = new Uint8Array([
      // descriptor bytes
      0x01, 0x02, 0x03, 0x04, 0x05,
      // signature tag
      0x15,
      // signature length
      0x03,
      // signature bytes
      0xaa, 0xbb, 0xcc,
    ]);
    expect(result).toEqual(expected);
  });
});

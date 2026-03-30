import network from "@ledgerhq/live-network";
import { getEnv } from "@ledgerhq/live-env";
import { convertCertificateToDeviceData, getCertificate } from "./certificate";

jest.mock("@ledgerhq/live-network", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("@ledgerhq/live-env", () => ({ getEnv: jest.fn() }));

const mockNetwork = jest.mocked(network);
const mockGetEnv = jest.mocked(getEnv);

function makeCertificateResponse(overrides?: object) {
  return {
    id: "cert-1",
    certificate_version: { major: 1, minor: 0, patch: 0 },
    target_device: "nanoX",
    not_valid_after: { major: 1, minor: 0, patch: 0 },
    public_key_usage: "trusted_name",
    descriptor: {
      data: "0102",
      signatures: { prod: "aabb", test: "ccdd" },
    },
    ...overrides,
  };
}

describe("getCertificate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEnv.mockReturnValue("");
    mockNetwork.mockResolvedValue({ data: [makeCertificateResponse()] } as any);
  });

  it.each([
    ["domain_metadata_key", "trusted_name"],
    ["token_metadata_key", "coin_meta"],
    ["yield", "perps_data"],
  ] as const)("uses public_key_id=%s when usage=%s", async (expectedKeyId, usage) => {
    mockNetwork.mockResolvedValue({
      data: [makeCertificateResponse({ public_key_usage: usage })],
    } as any);

    await getCertificate("nanoX", usage);

    expect(mockNetwork).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ public_key_id: expectedKeyId }),
      }),
    );
  });
});

describe("convertCertificateToDeviceData", () => {
  it("concatenates descriptor and signature with signature tag and length", () => {
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

  describe("descriptor validation", () => {
    it("throws when descriptor length is not a multiple of 2", () => {
      expect(() =>
        convertCertificateToDeviceData({ descriptor: "010203", signature: "aabb" }),
      ).not.toThrow();

      expect(() =>
        convertCertificateToDeviceData({ descriptor: "01020", signature: "aabb" }),
      ).toThrow("Invalid hex string length: expected even length, got 5");
    });

    it("throws when descriptor contains non-hex characters", () => {
      expect(() =>
        convertCertificateToDeviceData({ descriptor: "0102ZZ", signature: "aabb" }),
      ).toThrow("Invalid hex string content: only [0-9a-fA-F] characters are allowed");
    });
  });

  describe("signature validation", () => {
    it("throws when signature length is not a multiple of 2", () => {
      expect(() =>
        convertCertificateToDeviceData({ descriptor: "0102", signature: "aab" }),
      ).toThrow("Invalid hex string length: expected even length, got 3");
    });

    it("throws when signature contains non-hex characters", () => {
      expect(() =>
        convertCertificateToDeviceData({ descriptor: "0102", signature: "aaZZ" }),
      ).toThrow("Invalid hex string content: only [0-9a-fA-F] characters are allowed");
    });

    it("throws when signature has a length longer than 255 bytes", () => {
      const signature = "ab".repeat(256); // 256 bytes = 512 hex chars
      expect(() => convertCertificateToDeviceData({ descriptor: "0102", signature })).toThrow(
        "Signature too long: 256 bytes (maximum 255)",
      );
    });
  });
});

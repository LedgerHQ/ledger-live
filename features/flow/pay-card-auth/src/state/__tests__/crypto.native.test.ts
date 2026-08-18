import * as Crypto from "expo-crypto";
import { createRandomBase64Url, sha256Base64Url } from "../crypto.native";

jest.mock("expo-crypto", () => ({
  getRandomBytesAsync: jest.fn(),
  digestStringAsync: jest.fn(),
  CryptoDigestAlgorithm: { SHA256: "SHA-256" },
  CryptoEncoding: { BASE64: "base64" },
}));

const mockedGetRandomBytesAsync = jest.mocked(Crypto.getRandomBytesAsync);
const mockedDigestStringAsync = jest.mocked(Crypto.digestStringAsync);

describe("createRandomBase64Url", () => {
  it("asks the platform CSPRNG for the requested length", async () => {
    mockedGetRandomBytesAsync.mockResolvedValue(new Uint8Array(32));

    await createRandomBase64Url(32);

    expect(mockedGetRandomBytesAsync).toHaveBeenCalledWith(32);
  });

  // The value travels in a URL, so the two base64 characters that need escaping must not appear.
  it("encodes the bytes as unpadded base64url", async () => {
    mockedGetRandomBytesAsync.mockResolvedValue(new Uint8Array([255, 254, 253, 0]));

    expect(await createRandomBase64Url(4)).toBe("__79AA");
  });
});

describe("sha256Base64Url", () => {
  it("digests with SHA-256 and re-encodes the base64 answer as base64url", async () => {
    mockedDigestStringAsync.mockResolvedValue("qL+/8g==");

    expect(await sha256Base64Url("verifier")).toBe("qL-_8g");
    expect(mockedDigestStringAsync).toHaveBeenCalledWith("SHA-256", "verifier", {
      encoding: "base64",
    });
  });
});

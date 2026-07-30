import { bytesToBase64Url, toBase64Url } from "./base64Url";

describe("base64Url", () => {
  it("should convert base64 to an unpadded URL-safe value", () => {
    expect(toBase64Url("ab+/==")).toBe("ab-_");
  });

  it("should encode bytes as an unpadded URL-safe value", () => {
    expect(bytesToBase64Url(Uint8Array.from([251, 255]))).toBe("-_8");
  });
});

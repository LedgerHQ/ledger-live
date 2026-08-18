import { createRandomBase64Url, sha256Base64Url } from "../crypto.web";

// jsdom ships `getRandomValues` but no `subtle`, so the whole WebCrypto surface these two functions
// touch is stubbed — deterministically, to assert the base64url encoding rather than the browser's.
const getRandomValues = jest.fn();
const digest = jest.fn();

beforeAll(() => {
  Object.defineProperty(globalThis, "crypto", {
    configurable: true,
    value: { getRandomValues, subtle: { digest } },
  });
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("createRandomBase64Url", () => {
  it("fills a buffer of the requested length and encodes it as unpadded base64url", async () => {
    getRandomValues.mockImplementation((bytes: Uint8Array) => bytes.fill(255));

    expect(await createRandomBase64Url(3)).toBe("____");
    expect(getRandomValues.mock.calls[0][0]).toHaveLength(3);
  });
});

describe("sha256Base64Url", () => {
  it("digests the bytes of the value with SHA-256", async () => {
    digest.mockResolvedValue(new Uint8Array([255, 254, 253]).buffer);

    expect(await sha256Base64Url("verifier")).toBe("__79");
    expect(digest).toHaveBeenCalledWith(
      "SHA-256",
      Uint8Array.from("verifier", c => c.charCodeAt(0)),
    );
  });
});

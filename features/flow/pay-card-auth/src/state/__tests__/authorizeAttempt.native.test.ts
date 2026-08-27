import { createRandomBase64Url, sha256Base64Url } from "../crypto";
import { createAuthorizeAttempt } from "../authorizeAttempt";

jest.mock("../crypto", () => ({
  createRandomBase64Url: jest.fn(),
  sha256Base64Url: jest.fn(),
}));

const mockedCreateRandomBase64Url = jest.mocked(createRandomBase64Url);
const mockedSha256Base64Url = jest.mocked(sha256Base64Url);

describe("createAuthorizeAttempt", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedCreateRandomBase64Url.mockImplementation(async byteLength => `random-${byteLength}`);
    mockedSha256Base64Url.mockImplementation(async value => `sha256(${value})`);
  });

  it("derives the challenge from the verifier it generated", async () => {
    const attempt = await createAuthorizeAttempt();

    expect(attempt.codeChallenge).toBe(`sha256(${attempt.codeVerifier})`);
    expect(mockedSha256Base64Url).toHaveBeenCalledTimes(1);
  });

  it("draws one random value, and only the verifier", async () => {
    await createAuthorizeAttempt();

    expect(mockedCreateRandomBase64Url).toHaveBeenCalledTimes(1);
  });

  // 32 bytes give the 43 base64url characters RFC 7636 sets as the minimum verifier length.
  it("asks for enough entropy for the verifier", async () => {
    await createAuthorizeAttempt();

    expect(mockedCreateRandomBase64Url).toHaveBeenCalledWith(32);
  });
});

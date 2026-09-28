import { RFC6238_SECRET } from "../__mocks__/fetchMock";
import { generateTotpCodeAt } from "./totp";

describe("generateTotpCodeAt", () => {
  it("matches the RFC 6238 SHA1 vector truncated to 6 digits", () => {
    expect(
      generateTotpCodeAt(
        { secret: RFC6238_SECRET, digits: 6, period: 30, algorithm: "SHA1" },
        59_000,
      ),
    ).toBe("287082");
  });
});

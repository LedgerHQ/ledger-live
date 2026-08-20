import { parseCallbackUrl } from "../callbackUrl";

describe("parseCallbackUrl", () => {
  it("reads the code and the state from the redirect", () => {
    expect(parseCallbackUrl("ledgerlive://paytab?code=auth-code&state=state-value")).toEqual({
      code: "auth-code",
      state: "state-value",
    });
  });

  it("keeps a percent-encoded value intact", () => {
    expect(parseCallbackUrl("ledgerlive://paytab?code=a%2Bb&state=c%2Fd")).toEqual({
      code: "a+b",
      state: "c/d",
    });
  });

  it("ignores the parameters the provider adds beside them", () => {
    expect(
      parseCallbackUrl("ledgerlive://paytab?state=state-value&code=auth-code&scope=card"),
    ).toEqual({ code: "auth-code", state: "state-value" });
  });

  it.each([
    ["there is no query", "ledgerlive://paytab"],
    ["the query is empty", "ledgerlive://paytab?"],
    ["the code is missing", "ledgerlive://paytab?state=state-value"],
    ["the state is missing", "ledgerlive://paytab?code=auth-code"],
    ["the provider reported an error", "ledgerlive://paytab?error=access_denied"],
  ])("reads no callback when %s", (_case, url) => {
    expect(parseCallbackUrl(url)).toBeNull();
  });
});

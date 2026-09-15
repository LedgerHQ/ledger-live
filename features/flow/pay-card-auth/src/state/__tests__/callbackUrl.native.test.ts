import { parseCallbackUrl } from "../callbackUrl";

const REDIRECT = "https://go.ledger.com/ledger/card-baanx";

describe("parseCallbackUrl", () => {
  it("reads the code from the redirect", () => {
    expect(parseCallbackUrl(`${REDIRECT}?code=auth-code&app_id=app-value`)).toEqual({
      code: "auth-code",
    });
  });

  it("keeps a percent-encoded code intact", () => {
    expect(parseCallbackUrl(`${REDIRECT}?code=a%2Bb`)).toEqual({ code: "a+b" });
  });

  it("ignores the parameters the provider adds beside it", () => {
    expect(parseCallbackUrl(`${REDIRECT}?app_id=app-value&code=auth-code&scope=card`)).toEqual({
      code: "auth-code",
    });
  });

  it("still reads a custom scheme, which is not a hierarchical URL", () => {
    expect(parseCallbackUrl("ledgerlive://paytab?code=auth-code")).toEqual({ code: "auth-code" });
  });

  it("carries the state the provider echoed back", () => {
    expect(
      parseCallbackUrl(`${REDIRECT}?code=auth-code&state=state-value&app_id=app-value`),
    ).toEqual({
      code: "auth-code",
      state: "state-value",
    });
  });

  it.each([
    ["is missing", `${REDIRECT}?code=auth-code&app_id=app-value`],
    ["is empty", `${REDIRECT}?code=auth-code&state=`],
  ])("reads the code alone when the state %s", (_case, url) => {
    expect(parseCallbackUrl(url)).toEqual({ code: "auth-code" });
  });

  it.each([
    ["there is no query", REDIRECT],
    ["the query is empty", `${REDIRECT}?`],
    ["the code is missing", `${REDIRECT}?app_id=app-value`],
    ["the provider reported an error", `${REDIRECT}?error=access_denied`],
  ])("reads no callback when %s", (_case, url) => {
    expect(parseCallbackUrl(url)).toBeNull();
  });
});

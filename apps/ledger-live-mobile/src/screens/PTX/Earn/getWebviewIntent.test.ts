import { getIntentFlowState, getWebviewIntent } from "./getWebviewIntent";

describe("getWebviewIntent", () => {
  it("reads intent from the query string", () => {
    expect(getWebviewIntent("https://earn.test/v2/ios/deposit?intent=deposit&uiVersion=v4")).toBe(
      "deposit",
    );
    expect(getWebviewIntent("https://earn.test/v2/ios/earn-simulator?intent=simulate")).toBe(
      "simulate",
    );
  });

  it("infers intent from the pathname when the query param is absent", () => {
    expect(getWebviewIntent("https://earn.test/v2/android/deposit")).toBe("deposit");
    expect(getWebviewIntent("https://earn.test/v2/ios/earn-simulator")).toBe("simulate");
  });

  it("returns undefined for dashboard routes", () => {
    expect(getWebviewIntent("https://earn.test/v2/ios/homescreen")).toBeUndefined();
  });
});

describe("getIntentFlowState", () => {
  it("returns true for intent flow routes", () => {
    expect(getIntentFlowState("https://earn.test/v2/android/deposit?intent=deposit")).toBe(true);
  });

  it("returns false for the dashboard", () => {
    expect(getIntentFlowState("https://earn.test/v2/android/homescreen")).toBe(false);
  });

  it("returns null for unknown URLs", () => {
    expect(getIntentFlowState(undefined)).toBeNull();
    expect(getIntentFlowState("about:blank")).toBeNull();
  });

  it("returns true for the simulator route without an intent query param", () => {
    expect(getIntentFlowState("https://earn.test/v2/android/earn-simulator")).toBe(true);
  });

  it("stays in lockstep with getWebviewIntent for routes that merely contain an intent word", () => {
    // Regression: getIntentFlowState used to match a bare "deposit"/"simulate" substring, so a
    // route like /predeposit-info read as "in flow" while getWebviewIntent saw no intent. The two
    // are now derived from the same source and must never disagree.
    const url = "https://earn.test/v2/ios/predeposit-info";
    expect(getWebviewIntent(url)).toBeUndefined();
    expect(getIntentFlowState(url)).toBe(false);
  });
});

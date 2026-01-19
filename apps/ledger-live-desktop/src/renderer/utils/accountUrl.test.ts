import { getAccountUrl } from "./accountUrl";

describe("getAccountUrl", () => {
  it("should construct URL for main account without parent", () => {
    const accountId = "js:2:ethereum:0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3:";
    const url = getAccountUrl(accountId);
    expect(url).toBe("/account/js:2:ethereum:0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3:");
  });

  it("should construct URL for token account with parent", () => {
    const accountId =
      "js:2:ethereum:0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3:+ethereum%2Ferc20%2Fusd__coin";
    const parentId = "js:2:ethereum:0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3:";
    const url = getAccountUrl(accountId, parentId);
    expect(url).toBe(
      "/account/js:2:ethereum:0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3:/js:2:ethereum:0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3:+ethereum%2Ferc20%2Fusd__coin",
    );
  });

  it("should handle account IDs with slashes (React Router wildcard captures them)", () => {
    const accountId =
      "js:2:tron:TDyq9kiahZXthXHrpQNLyyRSj75kEZuYZQ:+tron/trc20/tr7nhqjekqxgtci8q8zy4pl8otszgjlj6t";
    const parentId = "js:2:tron:TDyq9kiahZXthXHrpQNLyyRSj75kEZuYZQ:";
    const url = getAccountUrl(accountId, parentId);
    expect(url).toBe(
      "/account/js:2:tron:TDyq9kiahZXthXHrpQNLyyRSj75kEZuYZQ:/js:2:tron:TDyq9kiahZXthXHrpQNLyyRSj75kEZuYZQ:+tron/trc20/tr7nhqjekqxgtci8q8zy4pl8otszgjlj6t",
    );
  });
});

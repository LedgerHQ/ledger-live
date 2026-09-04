import { redactSecureChannelToken } from ".";

const TOKEN = "s3cr3t-session-token";

describe("redactSecureChannelToken", () => {
  it("masks the token carried in the secure-channel path", () => {
    expect(redactSecureChannelToken(`ws://localhost:9752/secure-channel/${TOKEN}`)).toBe(
      "ws://localhost:9752/secure-channel/***",
    );
  });

  it("masks the token carried as a query param", () => {
    expect(redactSecureChannelToken(`wss://mock.example/update?token=${TOKEN}`)).toBe(
      "wss://mock.example/update?token=***",
    );
  });

  it("masks both occurrences, which is how the scriptrunner url ends up", () => {
    const url = `wss://mock.example/secure-channel/${TOKEN}?token=${TOKEN}`;

    const redacted = redactSecureChannelToken(url);

    expect(redacted).toBe("wss://mock.example/secure-channel/***?token=***");
    expect(redacted).not.toContain(TOKEN);
  });

  it("keeps a token that is followed by more path segments out of the mask", () => {
    expect(redactSecureChannelToken(`wss://mock.example/secure-channel/${TOKEN}/install`)).toBe(
      "wss://mock.example/secure-channel/***/install",
    );
  });

  it("leaves a url without a token untouched", () => {
    const url = "wss://scriptrunner.api.live.ledger.com/update";

    expect(redactSecureChannelToken(url)).toBe(url);
  });
});

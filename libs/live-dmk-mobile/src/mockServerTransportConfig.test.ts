import {
  DEFAULT_MOCK_SERVER_TRANSPORT_URL,
  configureMockServerTransport,
  getConfiguredMockServerTransport,
  getMockScriptRunnerBaseUrl,
  resetMockServerTransport,
} from "./mockServerTransportConfig";

describe("mockServerTransportConfig", () => {
  afterEach(() => {
    resetMockServerTransport();
  });

  it("keeps the default mock server url", () => {
    expect(DEFAULT_MOCK_SERVER_TRANSPORT_URL).toContain("device-mock-server");
  });

  it("strips a trailing slash when the transport is configured", () => {
    configureMockServerTransport({ url: "https://mock.example/", token: "token" });

    expect(getConfiguredMockServerTransport()).toEqual({
      url: "https://mock.example",
      token: "token",
    });
  });

  it("returns no script runner url without a session token", () => {
    expect(getMockScriptRunnerBaseUrl("https://mock.example")).toBeUndefined();
  });

  it("builds a secure-channel url for https and http mock servers", () => {
    expect(getMockScriptRunnerBaseUrl("https://mock.example/", "token")).toBe(
      "wss://mock.example/secure-channel/token",
    );
    expect(getMockScriptRunnerBaseUrl("http://10.0.2.2:3000", "token")).toBe(
      "ws://10.0.2.2:3000/secure-channel/token",
    );
  });
});

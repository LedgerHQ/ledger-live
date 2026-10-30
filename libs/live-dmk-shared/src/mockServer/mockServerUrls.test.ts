import {
  DEFAULT_MOCK_SERVER_TRANSPORT_URL,
  getMockScriptRunnerBaseUrl,
  getMockServerFrontendUrl,
  stripTrailingSlashes,
} from "./mockServerUrls";

describe("mockServerUrls", () => {
  it("should point the default url at the shared deployment", () => {
    expect(DEFAULT_MOCK_SERVER_TRANSPORT_URL).toContain("device-mock-server");
  });

  it("should strip every trailing slash", () => {
    expect(stripTrailingSlashes("http://localhost:9752///")).toBe("http://localhost:9752");
  });

  it("should return no script runner url without a session token", () => {
    expect(getMockScriptRunnerBaseUrl("https://mock.example")).toBeUndefined();
  });

  it("should build a secure-channel url for https and http mock servers", () => {
    expect(getMockScriptRunnerBaseUrl("https://mock.example/", "token")).toBe(
      "wss://mock.example/secure-channel/token",
    );
    expect(getMockScriptRunnerBaseUrl("http://10.0.2.2:3000", "token")).toBe(
      "ws://10.0.2.2:3000/secure-channel/token",
    );
  });

  it("should pass an escaped token to the frontend in the url hash", () => {
    expect(getMockServerFrontendUrl("https://mock.example/", "a+b/c=")).toBe(
      "https://mock.example/#token=a%2Bb%2Fc%3D",
    );
  });
});

import {
  getMockServerSecureChannelUrl,
  getMockServerConfigurationUiUrl,
  stripTrailingSlashes,
} from "./mockServerUrls";

describe("mockServerUrls", () => {
  it("should strip every trailing slash", () => {
    expect(stripTrailingSlashes("http://localhost:9752///")).toBe("http://localhost:9752");
  });

  it("should return no secure-channel url without a session token", () => {
    expect(getMockServerSecureChannelUrl("https://mock.example")).toBeUndefined();
  });

  it("should carry the session token in the secure-channel url path, as websockets take no bearer header", () => {
    expect(getMockServerSecureChannelUrl("https://mock.example/", "token")).toBe(
      "wss://mock.example/secure-channel/token",
    );
    expect(getMockServerSecureChannelUrl("http://10.0.2.2:3000", "token")).toBe(
      "ws://10.0.2.2:3000/secure-channel/token",
    );
  });

  it("should pass the escaped token in the url fragment, which never reaches the server logs", () => {
    expect(getMockServerConfigurationUiUrl("https://mock.example/", "a+b/c=")).toBe(
      "https://mock.example/#token=a%2Bb%2Fc%3D",
    );
  });
});

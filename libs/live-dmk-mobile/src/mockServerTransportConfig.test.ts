import {
  configureMockServerTransport,
  getConfiguredMockServerTransport,
  resetMockServerTransport,
} from "./mockServerTransportConfig";

describe("mockServerTransportConfig", () => {
  afterEach(() => {
    resetMockServerTransport();
  });

  it("strips a trailing slash when the transport is configured", () => {
    configureMockServerTransport({ url: "https://mock.example/", token: "token" });

    expect(getConfiguredMockServerTransport()).toEqual({
      url: "https://mock.example",
      token: "token",
    });
  });
});

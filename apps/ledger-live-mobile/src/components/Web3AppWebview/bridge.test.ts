import type { WebViewMessageEvent } from "react-native-webview";
import { getAllowedSenderOrigin, getMessagingAllowedOrigins } from "./bridge";

const messageEvent = (url: string, isMainFrame: boolean | undefined) =>
  ({ nativeEvent: { url, isMainFrame, data: "{}" } }) as unknown as WebViewMessageEvent;

describe("getAllowedSenderOrigin", () => {
  const domains = ["https://app.example.com"];

  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.mocked(console.warn).mockRestore();
  });

  it("accepts a main-frame message on a manifest origin", () => {
    expect(
      getAllowedSenderOrigin(messageEvent("https://app.example.com/page", true), domains),
    ).toBe("https://app.example.com");
  });

  it.each([
    ["a subframe", messageEvent("https://app.example.com/", false)],
    ["an unknown frame", messageEvent("https://app.example.com/", undefined)],
    ["another origin", messageEvent("https://evil.com/", true)],
    ["an opaque origin", messageEvent("about:blank", true)],
  ])("drops a message from %s", (_name, event) => {
    expect(getAllowedSenderOrigin(event, domains)).toBeUndefined();
  });

  it("answers any web origin when the domain check is off, never a known subframe", () => {
    expect(getAllowedSenderOrigin(messageEvent("https://evil.com/", undefined), undefined)).toBe(
      "https://evil.com",
    );
    expect(
      getAllowedSenderOrigin(messageEvent("https://iframe.com/", false), undefined),
    ).toBeUndefined();
  });
});

describe("getMessagingAllowedOrigins", () => {
  it("maps manifest domains to Android web message origin rules", () => {
    expect(
      getMessagingAllowedOrigins([
        "https://app.example.com",
        "https://*.partner.com",
        "http://localhost:3000",
        " https://app.example.com ",
        "https://app.example.com/path",
        "ftp://files.example.com",
      ]),
    ).toEqual(["https://app.example.com", "https://*.partner.com", "http://localhost:3000"]);
  });

  it.each([["https://"], ["https://*"], ["http://*"]])(
    "falls back to any origin for the scheme-wide domain %s",
    domain => {
      expect(getMessagingAllowedOrigins(["https://app.example.com", domain])).toBeUndefined();
    },
  );

  it("skips a wildcard without a host", () => {
    expect(getMessagingAllowedOrigins(["https://*.", "https://app.example.com"])).toEqual([
      "https://app.example.com",
    ]);
  });

  it("exposes the bridge to no origin for empty domains", () => {
    expect(getMessagingAllowedOrigins([])).toEqual([]);
  });

  it("keeps a bracketed IPv6 host", () => {
    expect(getMessagingAllowedOrigins(["http://[::1]:3000", "https://[2001:db8::1]"])).toEqual([
      "http://[::1]:3000",
      "https://[2001:db8::1]",
    ]);
  });

  it("leaves the bridge to any origin when the domain check is off", () => {
    expect(getMessagingAllowedOrigins(undefined)).toBeUndefined();
  });
});

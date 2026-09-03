import { getNoahGoToURL } from "./getNoahGoToURL";

const MANIFEST_URL = "https://noah.example/app?session=abc";

describe("getNoahGoToURL", () => {
  it("should rewrite the pathname to signup", () => {
    expect(getNoahGoToURL(MANIFEST_URL, "/auth/signup")).toBe(
      "https://noah.example/auth/signup?session=abc",
    );
  });

  it("should rewrite the pathname to signin", () => {
    expect(getNoahGoToURL(MANIFEST_URL, "/auth/signin")).toBe(
      "https://noah.example/auth/signin?session=abc",
    );
  });

  it("should set theme and lang query params when provided", () => {
    expect(getNoahGoToURL(MANIFEST_URL, "/auth/signup", { theme: "dark", lang: "fr" })).toBe(
      "https://noah.example/auth/signup?session=abc&theme=dark&lang=fr",
    );
  });

  it("should return undefined when the manifest url is missing", () => {
    expect(getNoahGoToURL(undefined, "/auth/signup")).toBeUndefined();
  });

  it("should return undefined when the auth path is missing", () => {
    expect(getNoahGoToURL(MANIFEST_URL, undefined)).toBeUndefined();
  });

  it("should return undefined when the manifest url is invalid", () => {
    expect(getNoahGoToURL("not-a-url", "/auth/signup")).toBeUndefined();
  });
});

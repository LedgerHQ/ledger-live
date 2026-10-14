import { decodeBase64Url, encodeBase64Url } from "./base64url";

describe("base64url", () => {
  it.each(["", "a", "ab", "abc", '{"local":"t?>","remote":null}', "héllo €"])(
    "round-trips %p",
    text => {
      expect(decodeBase64Url(encodeBase64Url(text))).toBe(text);
    },
  );

  it("encodes with the url alphabet and without padding", () => {
    expect(encodeBase64Url("??>")).toBe("Pz8-");
    expect(encodeBase64Url("???")).toBe("Pz8_");
    expect(encodeBase64Url("a")).toBe("YQ");
  });

  it("rejects characters outside the url alphabet", () => {
    expect(() => decodeBase64Url("Pz8+")).toThrow(TypeError);
    expect(() => decodeBase64Url("YQ==")).toThrow(TypeError);
  });

  it("rejects a length no base64 can have", () => {
    expect(() => decodeBase64Url("YWJjZ")).toThrow();
  });

  it("rejects bytes that are not utf-8", () => {
    expect(() => decodeBase64Url("_w")).toThrow("not valid");
  });
});

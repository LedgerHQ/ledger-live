import { encodeBase64Url } from "./base64url";
import { decodeCursors, encodeCursors } from "./token";

const tokenOf = (value: unknown) => encodeBase64Url(JSON.stringify(value));

describe("cursors token", () => {
  it.each([{}, { local: "l1" }, { remote: null }, { local: null, remote: "r1" }])(
    "round-trips %p",
    cursors => {
      expect(decodeCursors(encodeCursors(cursors))).toEqual(cursors);
    },
  );

  it("is a base64url-encoded JSON object", () => {
    expect(encodeCursors({ local: "l1", remote: null })).toBe(
      tokenOf({ local: "l1", remote: null }),
    );
  });

  it.each([
    ["not base64url", "a+b"],
    ["not JSON", encodeBase64Url("{")],
    ["a JSON string", tokenOf("local")],
    ["JSON null", tokenOf(null)],
    ["a JSON array", tokenOf(["l1"])],
    ["a non-string local cursor", tokenOf({ local: 1 })],
    ["a non-string remote cursor", tokenOf({ remote: {} })],
  ])("answers BAD_REQUEST for %s", (_, token) => {
    expect(() => decodeCursors(token)).toThrow(expect.objectContaining({ type: "BAD_REQUEST" }));
  });
});

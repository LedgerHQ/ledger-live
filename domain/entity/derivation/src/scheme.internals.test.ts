import { derivationScheme } from "./scheme.internals";

describe("derivationScheme", () => {
  it("brands a scheme of indexes and placeholders, hardened or not", () => {
    expect(derivationScheme("44'/<coin_type>'/<account>'/<node>/<address>")).toBe(
      "44'/<coin_type>'/<account>'/<node>/<address>",
    );
    expect(derivationScheme("44/3030")).toBe("44/3030");
  });

  it("rejects a misspelled segment at compile time and at runtime", () => {
    // @ts-expect-error `<acount>` is no placeholder
    expect(() => derivationScheme("44'/60'/<acount>'")).toThrow("Not a derivation scheme");
    // @ts-expect-error `m/` is the path prefix, not a scheme segment
    expect(() => derivationScheme("m/44'/60'")).toThrow("Not a derivation scheme");
  });
});

import { normalizeAddress } from "../../logic/normalizeAddress";

describe("normalizeAddress", () => {
  it("should return always 64 bytes address", () => {
    expect(normalizeAddress("0xfff")).toEqual(
      "0x0000000000000000000000000000000000000000000000000000000000000fff",
    );
  });

  it("should return the same 64 address", () => {
    expect(
      normalizeAddress("0x1230000000000000000000000000000000000000000000000000000000000fff"),
    ).toEqual("0x1230000000000000000000000000000000000000000000000000000000000fff");
  });
});

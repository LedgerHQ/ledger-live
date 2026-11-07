import { decodeMessage } from "./decodeMessage";

const hexOf = (text: string) => Buffer.from(text, "utf8").toString("hex");

describe("decodeMessage", () => {
  it("should show a printable message as UTF-8 text", () => {
    expect(decodeMessage(hexOf("Sign in to Ledger ✓\nnonce: 42"))).toBe(
      "Sign in to Ledger ✓\nnonce: 42",
    );
  });

  it("should accept a 0x prefix", () => {
    expect(decodeMessage(`0x${hexOf("hello")}`)).toBe("hello");
  });

  it("should show a binary message as hex", () => {
    expect(decodeMessage("00ff10")).toBe("0x00ff10");
  });

  it("should show an empty message as hex", () => {
    expect(decodeMessage("")).toBe("0x");
  });
});

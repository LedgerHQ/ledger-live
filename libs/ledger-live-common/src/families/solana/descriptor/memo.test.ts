import { memo } from "./memo";

jest.mock("@solana/web3.js", () => {
  throw new Error("the Solana memo descriptor must not load @solana/web3.js");
});

describe("solana memo descriptor", () => {
  it("exposes the 500-byte memo limit without loading the Solana SDK", () => {
    expect(memo.maxLength).toBe(500);
  });
});

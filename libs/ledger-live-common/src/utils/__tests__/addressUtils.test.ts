import { addressSplit, formatAddress } from "../addressUtils";

describe("formatAddress", () => {
  it("should format long addresses with ellipsis (default 4+4)", () => {
    expect(formatAddress("0x1234567890abcdef")).toBe("0x12...cdef");
  });

  it("should return short addresses as-is when below threshold", () => {
    expect(formatAddress("0x123")).toBe("0x123");
  });

  it("should support custom prefix/suffix length", () => {
    expect(formatAddress("0x1234567890abcdef", { prefixLength: 5, suffixLength: 5 })).toBe(
      "0x123...bcdef",
    );
  });

  it("should support different prefix and suffix lengths", () => {
    expect(formatAddress("0x1234567890abcdef", { prefixLength: 5, suffixLength: 4 })).toBe(
      "0x123...cdef",
    );
  });

  it("should handle empty string", () => {
    expect(formatAddress("")).toBe("");
  });

  it("should support custom separator", () => {
    expect(formatAddress("0x1234567890abcdef", { separator: "…" })).toBe("0x12…cdef");
  });

  it("should respect threshold option", () => {
    expect(formatAddress("123456789", { threshold: 10 })).toBe("123456789");
  });

  it("should support prefixLength 0", () => {
    expect(
      formatAddress("1234567890abcdef", {
        prefixLength: 0,
        suffixLength: 10,
        separator: "---",
      }),
    ).toBe("---7890abcdef");
  });

  it("should support empty separator", () => {
    expect(
      formatAddress("1234567890abcdef1234567890abcdef", {
        prefixLength: 5,
        suffixLength: 5,
        separator: "",
      }),
    ).toBe("12345bcdef");
  });
});

describe("addressSplit", () => {
  describe("Basic functionality", () => {
    it("should split a simple address correctly", () => {
      const result = addressSplit("HelloWorld", 2);
      expect(result).toEqual({
        start: "He",
        middle: "lloWor",
        end: "ld",
      });
    });

    it("should split a longer address with size 4", () => {
      const result = addressSplit("0x1234567890abcdef", 4);
      expect(result).toEqual({
        start: "0x12",
        middle: "34567890ab",
        end: "cdef",
      });
    });
  });

  describe("Boundary conditions", () => {
    it("should handle exact boundary where size * 2 equals address length", () => {
      const result = addressSplit("ABCDEF", 3);
      expect(result).toEqual({
        start: "ABC",
        middle: "",
        end: "DEF",
      });
    });

    it("should handle size equal to half address length", () => {
      const result = addressSplit("ABCDEFGH", 4);
      expect(result).toEqual({
        start: "ABCD",
        middle: "",
        end: "EFGH",
      });
    });

    it("should handle odd-length address with equal split", () => {
      const result = addressSplit("ABCDE", 2);
      expect(result).toEqual({
        start: "AB",
        middle: "C",
        end: "DE",
      });
    });

    it("should handle very long address", () => {
      const longAddress = "A".repeat(1000);
      const result = addressSplit(longAddress, 10);
      expect(result).toEqual({
        start: "A".repeat(10),
        middle: "A".repeat(980),
        end: "A".repeat(10),
      });
      expect(result.start.length + result.middle.length + result.end.length).toBe(1000);
    });
  });

  describe("Edge cases - size variations", () => {
    it("should handle size of 0", () => {
      const result = addressSplit("HelloWorld", 0);
      expect(result).toEqual({
        start: "",
        middle: "HelloWorld",
        end: "",
      });
    });

    it("should handle size of 1", () => {
      const result = addressSplit("HelloWorld", 1);
      expect(result).toEqual({
        start: "H",
        middle: "elloWorl",
        end: "d",
      });
    });

    it("should handle negative size", () => {
      const result = addressSplit("HelloWorld", -5);
      expect(result).toEqual({
        start: "",
        middle: "HelloWorld",
        end: "",
      });
    });

    it("should handle size larger than half the address length", () => {
      const result = addressSplit("Hello", 3);
      expect(result).toEqual({
        start: "He",
        middle: "",
        end: "llo",
      });
    });

    it("should handle size equal to address length", () => {
      const result = addressSplit("Hello", 5);
      expect(result).toEqual({
        start: "He",
        middle: "",
        end: "llo",
      });
    });

    it("should handle size larger than address length", () => {
      const result = addressSplit("Hello", 10);
      expect(result).toEqual({
        start: "He",
        middle: "",
        end: "llo",
      });
    });
  });

  describe("Edge cases - address variations", () => {
    it("should handle empty string", () => {
      const result = addressSplit("", 2);
      expect(result).toEqual({
        start: "",
        middle: "",
        end: "",
      });
    });

    it("should handle single character address", () => {
      const result = addressSplit("A", 1);
      expect(result).toEqual({
        start: "",
        middle: "",
        end: "A",
      });
    });

    it("should handle two character address", () => {
      const result = addressSplit("AB", 1);
      expect(result).toEqual({
        start: "A",
        middle: "",
        end: "B",
      });
    });

    it("should handle three character address with size 1", () => {
      const result = addressSplit("ABC", 1);
      expect(result).toEqual({
        start: "A",
        middle: "B",
        end: "C",
      });
    });
  });

  describe("Real-world cryptocurrency addresses", () => {
    it("should split a Bitcoin address correctly", () => {
      const bitcoinAddress = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
      const result = addressSplit(bitcoinAddress, 5);
      expect(result).toEqual({
        start: "1A1zP",
        middle: "1eP5QGefi2DMPTfTL5SLmv7D",
        end: "ivfNa",
      });
    });

    it("should split an Ethereum address correctly", () => {
      const ethAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
      const result = addressSplit(ethAddress, 6);
      expect(result).toEqual({
        start: "0x742d",
        middle: "35Cc6634C0532925a3b844Bc9e759",
        end: "5f0bEb",
      });
    });

    it("should handle a Solana address", () => {
      const solanaAddress = "7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDpvcMwJeK";
      const result = addressSplit(solanaAddress, 4);
      expect(result).toEqual({
        start: "7EqQ",
        middle: "dEULxWcraVx3mXKFjc84LhCkMGZCkRuDpvcM",
        end: "wJeK",
      });
    });

    it("should handle a Polkadot address", () => {
      const polkadotAddress = "15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5";
      const result = addressSplit(polkadotAddress, 6);
      expect(result).toEqual({
        start: "15oF4u",
        middle: "VJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMN",
        end: "Hr6Sp5",
      });
    });

    it("should handle a Cardano address", () => {
      const cardanoAddress =
        "addr1qxy3w7depgr3wle7kqwzz8u4h5f6gxqe9q0rk8w3n0d7wqxqk0n7n8s3w3w3w3w3w3w3w3w3w3w3w3w3w3w";
      const result = addressSplit(cardanoAddress, 8);
      expect(result).toEqual({
        start: "addr1qxy",
        middle: "3w7depgr3wle7kqwzz8u4h5f6gxqe9q0rk8w3n0d7wqxqk0n7n8s3w3w3w3w3w3w3w3w3w3w",
        end: "3w3w3w3w",
      });
    });

    it("should handle a Near protocol address", () => {
      const nearAddress = "alice.near";
      const result = addressSplit(nearAddress, 3);
      expect(result).toEqual({
        start: "ali",
        middle: "ce.n",
        end: "ear",
      });
    });
  });

  describe("Data integrity", () => {
    it("should preserve the entire address when concatenated", () => {
      const address = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
      const result = addressSplit(address, 5);
      const reconstructed = result.start + result.middle + result.end;
      expect(reconstructed).toBe(address);
    });
  });
});

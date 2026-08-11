import { deriveA4AccountId, normalizeAccountKey } from "./accountId";

describe("normalizeAccountKey", () => {
  it("lowercases EVM 0x address", () => {
    expect(normalizeAccountKey("0x742d35Cc6634C0532925a3b844Bc454e4438f44e")).toEqual(
      "0x742d35cc6634c0532925a3b844bc454e4438f44e",
    );
  });

  it.each<[string, string, string]>([
    [
      "bitcoin",
      "xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz",
      "xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz",
    ],
    [
      "canton",
      "BobCorp::12208fceed3e5e2ae59cb00f00d7b3a0cc7f1f1c53d44c5c22cd7424f1b79b4d66d::1",
      "BobCorp::12208fceed3e5e2ae59cb00f00d7b3a0cc7f1f1c53d44c5c22cd7424f1b79b4d66d::1",
    ],
    [
      "cardano",
      "addr1qx2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3n0d3vllmyqwsx5wktcd8cc3sq835lu7drv2xwl2wywfgs68faae",
      "addr1qx2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3n0d3vllmyqwsx5wktcd8cc3sq835lu7drv2xwl2wywfgs68faae",
    ],
    ["ripple", "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh", "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh"],
    [
      "solana",
      "EkmJ7PEGdPhUH1MSHcjLnz5MN8aJMGrxvfDz5kJKsmYT",
      "EkmJ7PEGdPhUH1MSHcjLnz5MN8aJMGrxvfDz5kJKsmYT",
    ],
    [
      "stellar",
      "GBOVKZBEM2YYLOCDCUXJ4IMRKHN4LCJAE7WEAEA2KF562XFAGDBOB64V",
      "GBOVKZBEM2YYLOCDCUXJ4IMRKHN4LCJAE7WEAEA2KF562XFAGDBOB64V",
    ],
    ["tezos", "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb", "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb"],
    ["tron", "TJmV3QHMiDHpFSs9v5BKxJaVxpAV3q6QnF", "TJmV3QHMiDHpFSs9v5BKxJaVxpAV3q6QnF"],
  ])("keeps %s address verbatim", (_, input, expected) => {
    expect(normalizeAccountKey(input)).toEqual(expected);
  });
});

describe("deriveA4AccountId", () => {
  it("returns known digest for ethereum address (EVM, lowercased before hashing)", () => {
    expect(deriveA4AccountId("0x742d35Cc6634C0532925a3b844Bc454e4438f44e")).toEqual(
      "ff8b25f1cdd03142b2300762c03b74ac6f8dffa401adf341971ed5b624da38b8",
    );
  });

  it("returns known digest for tron address (verbatim, case-sensitive)", () => {
    expect(deriveA4AccountId("TJmV3QHMiDHpFSs9v5BKxJaVxpAV3q6QnF")).toEqual(
      "8b56e0ded9f441c5426bff5706927b8970cd0329fb54748a27782fa208ca9223",
    );
  });
});

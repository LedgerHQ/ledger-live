import { deriveA4AccountId } from "./accountId";

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

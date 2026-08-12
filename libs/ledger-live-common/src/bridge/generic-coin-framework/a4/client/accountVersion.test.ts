import { computeA4AccountVersion } from "./accountVersion";

describe("computeA4AccountVersion", () => {
  it("empty array: hashes empty string", () => {
    expect(computeA4AccountVersion([])).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });

  it("single address abc", () => {
    expect(computeA4AccountVersion(["abc"])).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("single address Alice (case-sensitive)", () => {
    expect(computeA4AccountVersion(["Alice"])).toBe(
      "3bc51062973c458d5a6f2d8d64a023246354ad7e064b1e4e009ec8a0699a3043",
    );
  });

  it("two addresses joined by pipe after sort", () => {
    expect(computeA4AccountVersion(["abc", "def"])).toBe(
      "0def6826e591afbb7b4431daaa6f2a78c1e5af533cb94b6db1635efbf255cb16",
    );
  });

  it("two addresses: argument order does not affect result", () => {
    expect(computeA4AccountVersion(["def", "abc"])).toBe(
      "0def6826e591afbb7b4431daaa6f2a78c1e5af533cb94b6db1635efbf255cb16",
    );
  });

  it("three addresses sorted before hashing", () => {
    expect(computeA4AccountVersion(["zzz", "aaa", "mmm"])).toBe(
      "2708034dc4d5ccb5d59b36f103d9df3dc056ab6a6dc1fa81a72dcb6340d8f7be",
    );
  });

  it("three addresses: any permutation produces the same version", () => {
    const v1 = computeA4AccountVersion(["aaa", "mmm", "zzz"]);
    const v2 = computeA4AccountVersion(["mmm", "zzz", "aaa"]);
    const v3 = computeA4AccountVersion(["zzz", "aaa", "mmm"]);
    expect(v1).toBe(v2);
    expect(v2).toBe(v3);
  });

  it("duplicate addresses are not deduplicated", () => {
    expect(computeA4AccountVersion(["abc", "abc"])).toBe(
      "65e6db4579b323946bf9d125bd63fbe89a8d4b1e7d9248e745aeab67f8ab1c74",
    );
  });

  it("result is always 64 lowercase hex characters", () => {
    const versions = [
      computeA4AccountVersion([]),
      computeA4AccountVersion(["abc"]),
      computeA4AccountVersion(["abc", "def"]),
      computeA4AccountVersion(["zzz", "aaa", "mmm"]),
    ];
    for (const v of versions) {
      expect(v).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it("does not mutate the input array", () => {
    const addrs = ["zzz", "aaa"];
    computeA4AccountVersion(addrs);
    expect(addrs).toEqual(["zzz", "aaa"]);
  });

  it("EVM gold pair: checksummed and lowercase produce the same version", () => {
    const checksummed = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
    const lowercase = "0x742d35cc6634c0532925a3b844bc454e4438f44e";
    expect(computeA4AccountVersion([checksummed])).toBe(computeA4AccountVersion([lowercase]));
  });

  it("EVM gold pair: known digest for single checksummed address", () => {
    expect(computeA4AccountVersion(["0x742d35Cc6634C0532925a3b844Bc454e4438f44e"])).toBe(
      "ff8b25f1cdd03142b2300762c03b74ac6f8dffa401adf341971ed5b624da38b8",
    );
  });
});

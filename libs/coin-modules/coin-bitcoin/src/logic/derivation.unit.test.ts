import { cryptoFor } from "./currency";
import { deriveAddress, toBitcoinDerivationMode } from "./derivation";

const XPUB =
  "xpub6BkvrczwoUfLGaNPQFdWXaNFCLzojvw7jFqmKPffS3up21H9uWvo6PcBsQn151ZaffZnyMSZahKfHJSGu7bUViQYDGw3YaEHTM7AjqPhqXC";

describe("toBitcoinDerivationMode", () => {
  it.each(["Legacy", "SegWit", "Native SegWit", "Taproot"] as const)(
    "keeps wallet-btc's %j",
    mode => {
      expect(toBitcoinDerivationMode(mode)).toBe(mode);
    },
  );

  it.each([
    ["taproot", "Taproot"],
    ["native_segwit", "Native SegWit"],
    ["segwit", "SegWit"],
    ["segwit_unsplit", "SegWit"],
    ["", "Legacy"],
    ["unsplit", "Legacy"],
  ] as const)("maps Ledger Wallet's %j to %s", (mode, expected) => {
    expect(toBitcoinDerivationMode(mode)).toBe(expected);
  });

  it("refuses an unknown mode", () => {
    expect(() => toBitcoinDerivationMode("native segwit")).toThrow(
      "native segwit is not a derivationMode",
    );
  });
});

describe("deriveAddress", () => {
  const crypto = cryptoFor("bitcoin");

  it("derives the address of the key on a chain, whichever naming the mode uses", async () => {
    const expected = await crypto.getAddress("Native SegWit", XPUB, 1, 2);
    expect(expected).toMatch(/^bc1q/);
    await expect(
      deriveAddress("bitcoin", { key: XPUB, derivationMode: "native_segwit", chain: 1, index: 2 }),
    ).resolves.toBe(expected);
    await expect(
      deriveAddress("bitcoin", { key: XPUB, derivationMode: "Native SegWit", chain: 1, index: 2 }),
    ).resolves.toBe(expected);
  });

  it("encodes the address as the derivation mode says", async () => {
    const [legacy, taproot] = await Promise.all([
      deriveAddress("bitcoin", { key: XPUB, derivationMode: "", chain: 0, index: 0 }),
      deriveAddress("bitcoin", { key: XPUB, derivationMode: "taproot", chain: 0, index: 0 }),
    ]);
    expect(legacy).toMatch(/^1/);
    expect(taproot).toMatch(/^bc1p/);
  });
});

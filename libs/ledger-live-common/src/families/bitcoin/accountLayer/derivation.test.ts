import {
  addressDeriver,
  bitcoinAddressDeriver,
  cryptoFor,
  toWalletDerivationMode,
} from "./derivation";

const XPUB =
  "xpub6BkvrczwoUfLGaNPQFdWXaNFCLzojvw7jFqmKPffS3up21H9uWvo6PcBsQn151ZaffZnyMSZahKfHJSGu7bUViQYDGw3YaEHTM7AjqPhqXC";

describe("derivation", () => {
  it.each([
    ["taproot", "Taproot"],
    ["native_segwit", "Native SegWit"],
    ["segwit", "SegWit"],
    ["segwit_unsplit", "SegWit"],
    ["", "Legacy"],
  ] as const)("maps %j to wallet-btc's %s", (mode, expected) => {
    expect(toWalletDerivationMode(mode)).toBe(expected);
  });

  it("caches the currency rules", () => {
    expect(cryptoFor("bitcoin")).toBe(cryptoFor("bitcoin"));
  });

  it("derives the addresses of an xpub", async () => {
    const derive = addressDeriver("bitcoin", "Native SegWit", XPUB);
    expect(await derive(0, 0)).toBe(
      await cryptoFor("bitcoin").getAddress("Native SegWit", XPUB, 0, 0),
    );
    expect(await derive(0, 0)).not.toBe(await derive(1, 0));
  });

  it("derives from a Ledger Wallet derivation mode, as the multi-address engine asks", async () => {
    expect(await bitcoinAddressDeriver("bitcoin", "native_segwit", XPUB)(1, 2)).toBe(
      await addressDeriver("bitcoin", "Native SegWit", XPUB)(1, 2),
    );
  });
});

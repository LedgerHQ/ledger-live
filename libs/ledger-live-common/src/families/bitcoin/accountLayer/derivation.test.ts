import {
  accountPathFrom,
  accountPathOf,
  addressDeriver,
  addressPath,
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

  it("builds account and address paths", () => {
    expect(accountPathFrom("84'/0'", 3)).toBe("84'/0'/3'");
    expect(accountPathFrom("84'/0'/0'/0/0", 1)).toBe("84'/0'/1'");
    expect(accountPathOf("84'/0'/3'/0/12")).toBe("84'/0'/3'");
    expect(addressPath("84'/0'/3'", 1, 7)).toBe("84'/0'/3'/1/7");
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
});

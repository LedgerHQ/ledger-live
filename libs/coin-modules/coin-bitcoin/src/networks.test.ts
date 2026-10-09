import { getNetworkParameters } from "./networks";

describe("getNetworkParameters for Zcash", () => {
  it("keeps the mainnet version bytes for zcash", () => {
    const params = getNetworkParameters("zcash");

    expect([...params.P2PKHVersion]).toEqual([0x1c, 0xb8]);
    expect([...params.P2SHVersion]).toEqual([0x1c, 0xbd]);
    expect([...params.xpubVersion]).toEqual([0x04, 0x88, 0xb2, 0x1e]);
  });

  it("uses the testnet version bytes for zcash_testnet", () => {
    const params = getNetworkParameters("zcash_testnet");

    expect([...params.P2PKHVersion]).toEqual([0x1d, 0x25]);
    expect([...params.P2SHVersion]).toEqual([0x1c, 0xba]);
    expect([...params.xpubVersion]).toEqual([0x04, 0x35, 0x87, 0xcf]);
  });

  it("differs from zcash only by its identifier and version bytes", () => {
    const {
      identifier: _a,
      P2PKHVersion: _b,
      P2SHVersion: _c,
      xpubVersion: _d,
      ...mainnet
    } = getNetworkParameters("zcash");
    const {
      identifier: _e,
      P2PKHVersion: _f,
      P2SHVersion: _g,
      xpubVersion: _h,
      ...testnet
    } = getNetworkParameters("zcash_testnet");

    expect(testnet).toEqual(mainnet);
  });
});

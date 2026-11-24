import { getNetworkParameters } from "./networks";

describe("getNetworkParameters", () => {
  it("gives bitcoin_signet the testnet address and extended key versions", () => {
    const signet = getNetworkParameters("bitcoin_signet");

    expect(signet.P2PKHVersion).toEqual(Buffer.from([0x6f]));
    expect(signet.P2SHVersion).toEqual(Buffer.from([0xc4]));
    expect(signet.xpubVersion).toEqual(Buffer.from([0x04, 0x35, 0x87, 0xcf]));
    expect(signet).toEqual(getNetworkParameters("bitcoin_testnet"));
  });
});

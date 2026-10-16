import { BitcoinLikeSigHashType, getNetworkParameters } from "./networks";

describe("getNetworkParameters", () => {
  it.each([
    ["bitcoin", "btc"],
    ["bitcoin_testnet", "btc_testnet"],
    ["bitcoin_regtest", "btc_testnet"],
    ["bitcoin_cash", "abc"],
    ["bitcoin_gold", "btg"],
    ["zencash", "zen"],
    ["litecoin", "ltc"],
    ["digibyte", "dgb"],
    ["qtum", "qtum"],
    ["dash", "dash"],
    ["dogecoin", "doge"],
    ["komodo", "kmd"],
    ["decred", "dcr"],
  ])("returns the %s network as %s", (networkName, identifier) => {
    expect(getNetworkParameters(networkName).identifier).toBe(identifier);
  });

  it("signs the Bitcoin Cash forks with SIGHASH_FORKID", () => {
    const forkId = BitcoinLikeSigHashType.SIGHASH_ALL | BitcoinLikeSigHashType.SIGHASH_FORKID;
    expect(getNetworkParameters("bitcoin_cash").sigHash).toBe(forkId);
    expect(getNetworkParameters("bitcoin_gold").sigHash).toBe(forkId);
    expect(getNetworkParameters("bitcoin").sigHash).toBe(BitcoinLikeSigHashType.SIGHASH_ALL);
  });

  it("has no parameters for Zcash, served by coin-zcash", () => {
    expect(() => getNetworkParameters("zcash")).toThrow("No network parameters set for zcash");
  });
});

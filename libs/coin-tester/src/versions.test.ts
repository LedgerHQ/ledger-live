import { sandboxVersions, sandboxVersionsVariable } from "./versions";

describe("sandboxVersions", () => {
  it("reads the node and the indexer of a network from its variable", () => {
    expect(
      sandboxVersions("ethereum", {
        COIN_SANDBOX_ETHEREUM: "--node geth@1.17.9 --indexer atlas@2.38.16",
      }),
    ).toEqual({
      node: { implementation: "geth", version: "1.17.9" },
      indexer: { implementation: "atlas", version: "2.38.16" },
    });
  });

  it("reads an indexer without a version, and a node alone", () => {
    expect(
      sandboxVersions("sonic", {
        COIN_SANDBOX_SONIC: "--node sonic@2.2.5 --indexer etherscan-stub",
      }),
    ).toEqual({
      node: { implementation: "sonic", version: "2.2.5" },
      indexer: { implementation: "etherscan-stub" },
    });
    expect(sandboxVersions("core", { COIN_SANDBOX_CORE: "--node geth@1.0.27" })).toEqual({
      node: { implementation: "geth", version: "1.0.27" },
    });
  });

  it("names the variable of a network, in capitals", () => {
    expect(sandboxVersionsVariable("bitcoin_regtest")).toBe("COIN_SANDBOX_BITCOIN_REGTEST");
  });

  it("refuses a missing variable, naming it", () => {
    expect(() => sandboxVersions("ethereum", {})).toThrow(/COIN_SANDBOX_ETHEREUM is not set/);
    expect(() => sandboxVersions("ethereum", { COIN_SANDBOX_ETHEREUM: "  " })).toThrow(
      /COIN_SANDBOX_ETHEREUM is not set/,
    );
  });

  it.each([
    ["--indexer atlas@2.38.16", "--node is required"],
    ["--node geth", "--node needs a version"],
    ["--node geth@", "is not implementation@version"],
    ["--node @1.0", "is not implementation@version"],
    ["--node geth@1 --node geth@2", "--node is given twice"],
    ["--node geth@1 --indexer", "--indexer has no value"],
    ["--node --indexer atlas@1", "--node has no value"],
    ["--node geth@1 --node-port 8545", 'unexpected "--node-port"'],
    ["geth@1", 'unexpected "geth@1"'],
  ])("refuses %j", (text, message) => {
    expect(() => sandboxVersions("ethereum", { COIN_SANDBOX_ETHEREUM: text })).toThrow(message);
  });
});

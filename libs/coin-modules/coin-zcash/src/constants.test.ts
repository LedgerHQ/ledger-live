import { sanitizeEndpointForLog, zainoEndpoint } from "./constants";
import { TEST_CONFIG } from "./test/coinConfig";

// Sync and send must resolve the same endpoint, or a send would be built
// against a chain the account was never scanned on: both derive it here.
describe("zainoEndpoint", () => {
  it("keeps the gRPC URL it is given", () => {
    expect(zainoEndpoint(TEST_CONFIG.zaino.url, "zcash").grpcUrl).toBe(TEST_CONFIG.zaino.url);
  });

  it.each([
    ["zcash", "mainnet"],
    ["zcash_testnet", "testnet"],
    // The coin-tester's local node: mainnet rules, see zcash_regtest's currency definition.
    ["zcash_regtest", "mainnet"],
  ])("takes the network of %s from the currency: %s", (currencyId, network) => {
    expect(zainoEndpoint("https://zec-indexer.coin.ledger.com", currencyId)).toEqual({
      grpcUrl: "https://zec-indexer.coin.ledger.com",
      network,
    });
  });

  it("never reads the network from the URL", () => {
    expect(zainoEndpoint("https://testnet.zec.rocks", "zcash").network).toBe("mainnet");
    expect(zainoEndpoint("https://zec-indexer.coin.ledger.com", "zcash_testnet").network).toBe(
      "testnet",
    );
  });
});

describe("sanitizeEndpointForLog", () => {
  it("keeps only the origin for a plain URL", () => {
    expect(sanitizeEndpointForLog("https://my-node.example:8443")).toBe(
      "https://my-node.example:8443",
    );
  });

  it("strips userinfo, path, query params and hash", () => {
    expect(
      sanitizeEndpointForLog(
        "https://user:secret@my-node.example:8443/token/abc123?token=abc#frag",
      ),
    ).toBe("https://my-node.example:8443");
  });

  it("falls back to a placeholder for an unparsable URL", () => {
    expect(sanitizeEndpointForLog("not a url")).toBe("[unparsable endpoint]");
  });
});

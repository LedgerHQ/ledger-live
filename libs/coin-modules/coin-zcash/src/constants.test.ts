import { sanitizeEndpointForLog, zainoEndpoint } from "./constants";
import { TEST_CONFIG } from "./test/coinConfig";

const withZainoUrl = (url: string) => ({ ...TEST_CONFIG, zaino: { ...TEST_CONFIG.zaino, url } });

// Sync and send must resolve the same endpoint, or a send would be built
// against a chain the account was never scanned on: both derive it here.
describe("zainoEndpoint", () => {
  it("reads the gRPC URL from the coin config", () => {
    expect(zainoEndpoint(TEST_CONFIG).grpcUrl).toBe(TEST_CONFIG.zaino.url);
  });

  it.each([
    ["https://testnet.zec.rocks", "testnet"],
    ["https://my-testnet-node.example:443", "testnet"],
    ["https://zec-indexer.coin.ledger.com", "mainnet"],
  ])("infers the network of %s as %s", (url, network) => {
    expect(zainoEndpoint(withZainoUrl(url))).toEqual({ grpcUrl: url, network });
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

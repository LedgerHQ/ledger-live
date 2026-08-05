import {
  getZainoEndpoint,
  getZainoGrpcUrl,
  getZainoNetwork,
  setZainoGrpcUrl,
  ZCASH_GRPC_URL_MAINNET,
  ZCASH_GRPC_URL_TESTNET,
} from "./constants";

afterEach(() => setZainoGrpcUrl(null));

// Sync and send must resolve the same endpoint, or a send would be built
// against a chain the account was never scanned on.
describe("zaino endpoint", () => {
  it("defaults to mainnet", () => {
    expect(getZainoEndpoint()).toEqual({ grpcUrl: ZCASH_GRPC_URL_MAINNET, network: "mainnet" });
  });

  it.each([
    [ZCASH_GRPC_URL_TESTNET, "testnet"],
    ["https://my-testnet-node.example:443", "testnet"],
    ["https://my-node.example:443", "mainnet"],
  ])("infers the network of %s as %s", (url, network) => {
    setZainoGrpcUrl(url);

    expect(getZainoEndpoint()).toEqual({ grpcUrl: url, network });
  });

  // An explicit network wins over what the URL looks like: inference is only a
  // fallback, and a node named "testnet" can serve mainnet.
  it.each([
    ["https://my-node.example:443", "testnet"],
    [ZCASH_GRPC_URL_TESTNET, "mainnet"],
  ] as [string, "mainnet" | "testnet"][])("takes %s on the %s it was told", (url, network) => {
    setZainoGrpcUrl(url, network);

    expect(getZainoEndpoint()).toEqual({ grpcUrl: url, network });
  });

  it("drops the network override when the URL is reset, so the two stay consistent", () => {
    setZainoGrpcUrl("https://my-node.example:443", "testnet");

    setZainoGrpcUrl(null);

    expect(getZainoGrpcUrl()).toBe(ZCASH_GRPC_URL_MAINNET);
    expect(getZainoNetwork()).toBe("mainnet");
  });
});

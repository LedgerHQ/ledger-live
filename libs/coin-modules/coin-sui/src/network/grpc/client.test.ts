import { SuiGrpcClient } from "@mysten/sui/grpc";
import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";
import { grpcWebFetch } from "./fetch";
import { createSuiGrpcClient } from "./client";

jest.mock("@mysten/sui/grpc", () => ({ SuiGrpcClient: jest.fn() }));
jest.mock("@protobuf-ts/grpcweb-transport", () => ({ GrpcWebFetchTransport: jest.fn() }));

const SuiGrpcClientMock = SuiGrpcClient as unknown as jest.Mock;
const GrpcWebFetchTransportMock = GrpcWebFetchTransport as unknown as jest.Mock;

beforeEach(() => {
  SuiGrpcClientMock.mockReset();
  GrpcWebFetchTransportMock.mockReset();
});

describe("createSuiGrpcClient", () => {
  // Regression guard for the trap that makes this factory necessary: SuiGrpcClient accepts
  // a `fetch` option, then forwards only `baseUrl`/`fetchInit` to the transport. Constructing
  // it from `baseUrl` would drop the retry-aware fetcher with no error and no retries.
  it("injects a transport built with the gRPC-web fetch wrapper", () => {
    createSuiGrpcClient({ url: "https://sui.coin.ledger.com" });

    expect(GrpcWebFetchTransportMock).toHaveBeenCalledWith({
      baseUrl: "https://sui.coin.ledger.com",
      fetch: grpcWebFetch,
    });
  });

  it("passes the transport to SuiGrpcClient instead of a baseUrl", () => {
    createSuiGrpcClient({ url: "https://sui.coin.ledger.com" });

    const options = SuiGrpcClientMock.mock.calls[0][0];
    expect(options.transport).toBe(GrpcWebFetchTransportMock.mock.instances[0]);
    expect(options).not.toHaveProperty("baseUrl");
  });

  it.each([
    ["https://sui.coin.ledger.com", "mainnet"],
    ["https://fullnode.testnet.sui.io:443", "testnet"],
    ["https://fullnode.devnet.sui.io:443", "devnet"],
    ["http://127.0.0.1:9000", "localnet"],
  ])("infers the network from %s", (url, expected) => {
    createSuiGrpcClient({ url });

    expect(SuiGrpcClientMock.mock.calls[0][0].network).toBe(expected);
  });
});

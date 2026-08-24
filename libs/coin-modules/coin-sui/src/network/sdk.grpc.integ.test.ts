import { getEnv } from "@ledgerhq/live-env";
import type { SuiCoinConfig } from "../config";
import { withGrpcApi } from "./sdk.grpc";

// Live proof that the hand-built gRPC-web transport reaches the chain: the SDK never sees a
// `baseUrl`, so a broken transport injection surfaces here rather than in mocked unit tests.
describe("gRPC-web transport (live mainnet)", () => {
  const config: SuiCoinConfig = {
    status: { type: "active" },
    node: {
      url: getEnv("API_SUI_NODE_PROXY"),
      graphqlUrl: getEnv("API_SUI_GRAPHQL_PROXY"),
      grpcUrl: getEnv("API_SUI_GRPC_PROXY"),
    },
    features: { transport: "grpc" },
  };

  // Liveness is asserted through GetEpoch rather than the more obvious GetServiceInfo:
  // sui.coin.ledger.com intermittently answers GetServiceInfo with grpc-status 14
  // (UNAVAILABLE) while every other method stays healthy, and the public fullnode serves it
  // fine — so pinning liveness to it would make this suite red on an upstream flap.
  // `core.getChainIdentifier` is avoided for the same reason: it reads GetServiceInfo.
  //
  // protobuf-ts returns a `UnaryCall`, which is thenable but not a `Promise`; `.response` is
  // the actual promise, and is what every gRPC arm should hand back to `withGrpcApi`.
  it("reaches mainnet through LedgerService", async () => {
    const epoch = await withGrpcApi(
      config,
      api => api.ledgerService.getEpoch({ readMask: { paths: ["epoch"] } }).response,
    );

    expect(Number(epoch.epoch?.epoch)).toBeGreaterThan(0);
  });

  it("serves the Core API used by transaction building", async () => {
    const { referenceGasPrice } = await withGrpcApi(config, api => api.core.getReferenceGasPrice());

    expect(BigInt(referenceGasPrice)).toBeGreaterThan(0n);
  });

  // gRPC echoes struct tags in canonical form (32-byte address), not the short `0x2` form
  // callers send. Adapters mapping gRPC responses onto coin-sui's types must normalise, the
  // same way the GraphQL adapter does.
  it("reads a balance through StateService and returns a canonical coin type", async () => {
    const owner = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const balance = await withGrpcApi(
      config,
      api => api.stateService.getBalance({ owner, coinType: "0x2::sui::SUI" }).response,
    );

    expect(balance.balance?.coinType).toBe(`0x${"0".repeat(63)}2::sui::SUI`);
  });
});

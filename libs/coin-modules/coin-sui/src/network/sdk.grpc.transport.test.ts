import type { SuiCoinConfig } from "../config";
import { createSuiGrpcClient } from "./grpc/client";
import { withCoreApi, withTransport } from "./sdk";
import { withGrpcApi } from "./sdk.grpc";

jest.mock("./grpc/client", () => ({ createSuiGrpcClient: jest.fn() }));

const createClientMock = createSuiGrpcClient as unknown as jest.Mock;

const JSON_RPC_URL = "https://json-rpc.example.test";
const GRAPHQL_URL = "https://graphql.example.test/graphql";
const GRPC_URL = "https://grpc.example.test";

// Any caller leaking onto another transport fails loudly rather than silently returning.
const unexpectedJsonRpc = jest.fn(() => {
  throw new Error("JSON-RPC arm invoked on the gRPC test path");
});
const unexpectedGraphql = jest.fn(() => {
  throw new Error("GraphQL arm invoked on the gRPC test path");
});

/** Config is injected per call (ADR-019), so each test picks its transport by passing one of these. */
const configFor = (transport: "json" | "grpc" | "graphql"): SuiCoinConfig =>
  ({
    node: { url: JSON_RPC_URL, graphqlUrl: GRAPHQL_URL, grpcUrl: GRPC_URL },
    status: { type: "active" },
    features: { transport },
  }) as unknown as SuiCoinConfig;

const grpcConfig = configFor("grpc");

beforeEach(() => {
  createClientMock.mockReset();
  createClientMock.mockReturnValue({ marker: "grpc-client" });
  unexpectedJsonRpc.mockClear();
  unexpectedGraphql.mockClear();
});

describe("withGrpcApi", () => {
  it("reads node.grpcUrl, not node.url or node.graphqlUrl", async () => {
    await withGrpcApi(grpcConfig, async () => undefined);

    expect(createClientMock).toHaveBeenCalledWith({ url: GRPC_URL });
  });

  it("hands the constructed client to the callback", async () => {
    const client = await withGrpcApi(grpcConfig, async api => api);

    expect(client).toEqual({ marker: "grpc-client" });
  });
});

describe("withTransport routing", () => {
  it("routes to the gRPC arm when transport is grpc", async () => {
    const result = await withTransport(grpcConfig, {
      jsonRpc: unexpectedJsonRpc,
      graphql: unexpectedGraphql,
      grpc: async () => "from-grpc",
    });

    expect(result).toBe("from-grpc");
    expect(unexpectedJsonRpc).not.toHaveBeenCalled();
    expect(unexpectedGraphql).not.toHaveBeenCalled();
  });

  // Locks in the no-fallback rule at the type level: `grpc` is mandatory, so a call site that omits
  // it cannot compile and can never silently downgrade to another transport.
  it("requires a gRPC arm at every call site", async () => {
    // @ts-expect-error - `grpc` is required; omitting it must not compile.
    const call = withTransport(grpcConfig, {
      jsonRpc: unexpectedJsonRpc,
      graphql: unexpectedGraphql,
    });
    // The rejection itself is incidental; what matters is that neither other arm ran.
    await expect(call).rejects.toBeDefined();
    expect(unexpectedJsonRpc).not.toHaveBeenCalled();
    expect(unexpectedGraphql).not.toHaveBeenCalled();
  });

  it("does not construct a gRPC client on the other transports", async () => {
    await withTransport(configFor("graphql"), {
      jsonRpc: unexpectedJsonRpc,
      graphql: async () => "from-graphql",
      grpc: async () => "from-grpc",
    });

    expect(createClientMock).not.toHaveBeenCalled();
  });
});

// Signing takes a client rather than a wire protocol, so it is the one caller that could plausibly
// hardcode a transport — which would strand it once that transport is retired.
describe("withCoreApi", () => {
  it("hands the gRPC client through unwrapped", async () => {
    const client = await withCoreApi(grpcConfig, async api => api);

    expect(client).toEqual({ marker: "grpc-client" });
  });

  it.each(["json", "graphql"] as const)(
    "exposes the core API on the %s transport",
    async transport => {
      const client = await withCoreApi(configFor(transport), async api => api);

      // `getObjects` is what the signer's input-object fallback calls, so it is the part of the
      // core surface that has to be real on every transport.
      expect(typeof client.core.getObjects).toBe("function");
      expect(createClientMock).not.toHaveBeenCalled();
    },
  );
});

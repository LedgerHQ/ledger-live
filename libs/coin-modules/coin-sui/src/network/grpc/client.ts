import { SuiGrpcClient } from "@mysten/sui/grpc";
import { GrpcWebFetchTransport } from "@protobuf-ts/grpcweb-transport";
import { inferNetworkFromUrl } from "../fetcher";
import { grpcWebFetch } from "./fetch";

/**
 * Builds the gRPC-web transport explicitly instead of passing `baseUrl`.
 *
 * `SuiGrpcClient`'s constructor forwards only `baseUrl` and `fetchInit` to
 * `GrpcWebFetchTransport`, silently dropping `fetch`, `format`, `meta`, `interceptors` and
 * `timeout`. Injecting the transport is the only construction path that keeps the
 * retry-aware `fetcher` the other two transports use; `baseUrl` would lose it with no error.
 *
 * The injected fetch is {@link grpcWebFetch}: the shared `fetcher` plus a buffered-body fallback.
 *
 * Known gap: `fetcher` replaces the incoming `signal` with its own per-attempt timeout
 * controller, so a caller's `RpcOptions.abort` does not reach the wire. No coin-sui caller
 * passes `abort`.
 *
 * Wire format stays gRPC-web text (base64) — protobuf-ts's default, and what both Ledger's
 * proxy and the public fullnodes answer with.
 */
export function createSuiGrpcClient({ url }: { url: string }): SuiGrpcClient {
  return new SuiGrpcClient({
    network: inferNetworkFromUrl(url),
    transport: new GrpcWebFetchTransport({ baseUrl: url, fetch: grpcWebFetch }),
  });
}

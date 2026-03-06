/**
 * Concordium gRPC Client — React Native stub
 *
 * Metro resolves this file instead of grpcClient.ts on React Native,
 * severing the dependency chain to @grpc/grpc-js, @grpc/proto-loader,
 * and node:path. The bridge layer (sync, broadcast, sign) uses only
 * proxyClient (HTTP REST) and never reaches these functions at runtime.
 */
import type {
  Block,
  BlockInfo,
  Operation,
  ListOperationsOptions,
  Page,
} from "@ledgerhq/coin-framework/api/index";

type GRPCClient = never;

export function getClient(_currencyId: string): GRPCClient {
  throw new Error("gRPC client is not available in React Native");
}

export async function withClient<T>(
  _currencyId: string,
  _execute: (client: GRPCClient) => Promise<T>,
  _retries?: number,
): Promise<T> {
  throw new Error("gRPC client is not available in React Native");
}

export async function getLastBlock(_currencyId: string): Promise<BlockInfo> {
  throw new Error("gRPC getLastBlock() method is not available in React Native");
}

export async function getBlockInfoByHeight(
  _currencyId: string,
  _height: number,
): Promise<BlockInfo> {
  throw new Error("gRPC getBlockInfoByHeight() method is not available in React Native");
}

export async function getBlockByHeight(_currencyId: string, _height: number): Promise<Block> {
  throw new Error("gRPC getBlockByHeight() method is not available in React Native");
}

export async function getOperations(
  _currencyId: string,
  _address: string,
  _options: ListOperationsOptions,
): Promise<Page<Operation>> {
  throw new Error("gRPC getOperations() method is not available in React Native");
}

import type { NodeApi } from "./types";

export function mockNodeApi(overrides: Partial<NodeApi> = {}): NodeApi {
  return {
    getTransaction: jest.fn(),
    getCoinBalance: jest.fn(),
    getTokenBalance: jest.fn(),
    getTransactionCount: jest.fn(),
    getGasEstimation: jest.fn(),
    getFeeData: jest.fn(),
    broadcastTransaction: jest.fn(),
    getBlockByHeight: jest.fn(),
    getBlockReceipts: jest.fn(),
    traceBlock: jest.fn(),
    getOptimismAdditionalFees: jest.fn(),
    getScrollAdditionalFees: jest.fn(),
    ...overrides,
  } as NodeApi;
}

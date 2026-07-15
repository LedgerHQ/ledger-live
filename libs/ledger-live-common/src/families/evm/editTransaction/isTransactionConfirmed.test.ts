import { getNodeApi } from "@ledgerhq/coin-evm/network/node/index";
import type { NodeApi } from "@ledgerhq/coin-evm/network/node/types";
import { isTransactionConfirmed } from "./isTransactionConfirmed";

jest.mock("@ledgerhq/coin-evm/network/node/index", () => ({
  ...jest.requireActual("@ledgerhq/coin-evm/network/node/index"),
  getNodeApi: jest.fn(),
}));

function mockNodeApi(overrides: Partial<jest.Mocked<NodeApi>> = {}): jest.Mocked<NodeApi> {
  return {
    getTransaction: jest.fn(),
    getCoinBalance: jest.fn(),
    getTokenBalance: jest.fn(),
    getTokenAllowance: jest.fn(),
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
  } as jest.Mocked<NodeApi>;
}

const mockGetNodeApi = jest.mocked(getNodeApi);

describe("isTransactionConfirmed", () => {
  const nodeApiMock = mockNodeApi();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNodeApi.mockReturnValue(nodeApiMock);
  });

  test("should return true if blockHeight is not null", async () => {
    const currency = { id: "external-coin" } as any;
    const hash = "transactionHash";
    const blockHeight = 12345;

    nodeApiMock.getTransaction.mockResolvedValue({ blockHeight } as any);

    const result = await isTransactionConfirmed({ currency, hash });

    expect(result).toBe(true);
    expect(nodeApiMock.getTransaction).toHaveBeenCalledWith(currency, hash);
  });

  test("should return false if blockHeight is null", async () => {
    const currency = { id: "external-coin" } as any;
    const hash = "transactionHash";
    const blockHeight = null;

    nodeApiMock.getTransaction.mockResolvedValue({ blockHeight } as any);

    const result = await isTransactionConfirmed({ currency, hash });

    expect(result).toBe(false);
    expect(nodeApiMock.getTransaction).toHaveBeenCalledWith(currency, hash);
  });
});

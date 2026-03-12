import { getNodeApi } from "../network/node";
import { mockNodeApi } from "../network/node/node.fixtures";
import { isTransactionConfirmed } from "./isTransactionConfirmed";

jest.mock("../network/node", () => ({
  ...jest.requireActual("../network/node"),
  getNodeApi: jest.fn(),
}));

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

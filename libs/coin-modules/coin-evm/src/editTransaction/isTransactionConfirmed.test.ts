import { getCoinConfig } from "../config";
import { getNodeApi } from "../network/node";
import { isTransactionConfirmed } from "./isTransactionConfirmed";

// FIXME setup to complicated, maybe we could have a factory for tests

const mockGetTransaction = jest.fn();
jest.mock("../config");
jest.mock("../network/node", () => ({
  ...jest.requireActual("../network/node"),
  getNodeApi: jest.fn(),
}));

const mockGetConfig = jest.mocked(getCoinConfig);
const mockGetNodeApi = jest.mocked(getNodeApi);

describe("isTransactionConfirmed", () => {
  beforeEach(() => {
    mockGetConfig.mockImplementation((): any => ({
      info: { node: { type: "external" } },
    }));
    mockGetNodeApi.mockReturnValue({ getTransaction: mockGetTransaction } as any);
    jest.clearAllMocks();
  });

  test("should return true if blockHeight is not null", async () => {
    const currency = { id: "external-coin" } as any;
    const hash = "transactionHash";
    const blockHeight = 12345;

    mockGetTransaction.mockResolvedValue({ blockHeight } as any);

    const result = await isTransactionConfirmed({ currency, hash });

    expect(result).toBe(true);
    expect(mockGetTransaction).toHaveBeenCalledWith(currency, hash);
  });

  test("should return false if blockHeight is null", async () => {
    const currency = { id: "external-coin" } as any;
    const hash = "transactionHash";
    const blockHeight = null;

    mockGetTransaction.mockResolvedValue({ blockHeight } as any);

    const result = await isTransactionConfirmed({ currency, hash });

    expect(result).toBe(false);
    expect(mockGetTransaction).toHaveBeenCalledWith(currency, hash);
  });
});

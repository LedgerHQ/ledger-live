import { getCoinConfig } from "../config";
import { getTransaction } from "../network/node/rpc.common";
import { isTransactionConfirmed } from "./isTransactionConfirmed";

jest.mock("../config");
jest.mock("../network/node/rpc.common", () => ({
  getTransaction: jest.fn(),
}));

const mockGetConfig = jest.mocked(getCoinConfig);
const mockGetTransaction = getTransaction as jest.Mock;

describe("isTransactionConfirmed", () => {
  beforeEach(() => {
    mockGetConfig.mockImplementation((): any => {
      return {
        info: {
          node: { type: "external" },
        },
      };
    });
  });

  beforeEach(() => {
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

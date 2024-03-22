import { isTransactionConfirmed } from "../../../editTransaction/isTransactionConfirmed";
import * as nodeApi from "../../../api/node/rpc.common";
import { getCoinConfig } from "../../../config";

jest.mock("../../../config");
const mockGetConfig = jest.mocked(getCoinConfig);

describe("isTransactionConfirmed", () => {
  const mockedNodeApi = jest.mocked(nodeApi);

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

    jest.spyOn(nodeApi, "getTransaction").mockResolvedValue({ blockHeight } as any);

    const result = await isTransactionConfirmed({ currency, hash });

    expect(result).toBe(true);
    expect(mockedNodeApi.getTransaction).toHaveBeenCalledWith(currency, hash);
  });

  test("should return false if blockHeight is null", async () => {
    const currency = { id: "external-coin" } as any;
    const hash = "transactionHash";
    const blockHeight = null;

    jest.spyOn(nodeApi, "getTransaction").mockResolvedValue({ blockHeight } as any);

    const result = await isTransactionConfirmed({ currency, hash });

    expect(result).toBe(false);
    expect(mockedNodeApi.getTransaction).toHaveBeenCalledWith(currency, hash);
  });
});

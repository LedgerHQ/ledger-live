import { AptosAPI } from "../../network";
import { getBalance } from "../../logic/getBalance";
import { APTOS_ASSET_ID } from "../../constants";
import BigNumber from "bignumber.js";

jest.mock("../../network", () => {
  return {
    AptosAPI: jest.fn().mockImplementation(() => ({
      getBalances: jest.fn(),
    })),
  };
});

describe("getBalance", () => {
  let mockGetBalances: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetBalances = jest
      .fn()
      .mockResolvedValue([{ asset_type: APTOS_ASSET_ID, amount: BigNumber(10) }]);

    (AptosAPI as jest.Mock).mockImplementation(() => ({
      getBalances: mockGetBalances,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should returns balance with value 10", async () => {
    mockGetBalances.mockResolvedValue([{ asset_type: APTOS_ASSET_ID, amount: new BigNumber(10) }]);

    const accountAddress = "0x4be47904b31063d60ac0dfde06e5dc203e647edbe853bae0e666ae5a763c3906";
    const client = new AptosAPI("aptos");
    const balance = await getBalance(client, accountAddress);

    expect(balance).toBeDefined();
    expect(balance).toMatchObject([{ value: BigInt(10), asset: { type: "native" } }]);
    expect(mockGetBalances).toHaveBeenCalledWith(accountAddress);
  });
});

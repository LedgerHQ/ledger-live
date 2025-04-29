import { Account, type AptosSettings } from "@aptos-labs/ts-sdk";
import { getBalance } from "../../logic";
import { AptosAPI } from "../../network";

jest.mock("../../network");
let mockedAptosAPI: jest.Mocked<any>;

describe("getBalance", () => {
  beforeEach(() => {
    mockedAptosAPI = jest.mocked(AptosAPI);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should returns balance with value 10", async () => {
    const mockGetBalance = jest.fn().mockImplementation(async (_address: string) => BigInt(10));
    mockedAptosAPI.mockImplementation(() => ({
      getBalance: mockGetBalance,
    }));
    const mockGetBalanceSpy = jest.spyOn({ getBalance: mockGetBalance }, "getBalance");

    const account = Account.generate();
    const balance = await getBalance({} as AptosSettings, account.accountAddress.toString());
    expect(balance).toBeDefined();
    expect(balance).toMatchObject([{ value: BigInt(10), asset: { type: "native" } }]);
    expect(mockGetBalanceSpy).toHaveBeenCalledWith(account.accountAddress.toString());
  });
});

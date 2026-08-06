import BigNumber from "bignumber.js";
import { FUNDED_ACCOUNT } from "../__tests__/fixtures/accountState.fixture";
import { CASPER_DUMMY_ADDRESS } from "../constants";
import { fetchAccountStateInfo, fetchBalance } from "../network/api";
import { getBalance } from "./getBalance";

jest.mock("../network/api", () => ({
  fetchAccountStateInfo: jest.fn(),
  fetchBalance: jest.fn(),
}));

const mockedFetchAccountStateInfo = jest.mocked(fetchAccountStateInfo);
const mockedFetchBalance = jest.mocked(fetchBalance);

const EXPONENTIAL_NOTATION_THRESHOLD_MOTES = "1000000000000000000000"; // 1e21

describe("getBalance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the native CSPR balance for a funded account", async () => {
    mockedFetchAccountStateInfo.mockResolvedValue({
      purseUref: FUNDED_ACCOUNT.purseUref,
      accountHash: FUNDED_ACCOUNT.accountHash,
    });
    mockedFetchBalance.mockResolvedValue(new BigNumber(FUNDED_ACCOUNT.balanceMotes));

    const result = await getBalance(FUNDED_ACCOUNT.publicKey);

    expect(mockedFetchAccountStateInfo).toHaveBeenCalledTimes(1);
    expect(mockedFetchAccountStateInfo).toHaveBeenCalledWith(FUNDED_ACCOUNT.publicKey);
    expect(mockedFetchBalance).toHaveBeenCalledTimes(1);
    expect(mockedFetchBalance).toHaveBeenCalledWith(FUNDED_ACCOUNT.purseUref);
    expect(result).toEqual([
      { value: BigInt(FUNDED_ACCOUNT.balanceMotes), asset: { type: "native" } },
    ]);
  });

  it("returns a zero native balance when the account has no main purse", async () => {
    mockedFetchAccountStateInfo.mockResolvedValue({
      purseUref: undefined,
      accountHash: undefined,
    });

    const result = await getBalance(CASPER_DUMMY_ADDRESS);

    expect(mockedFetchBalance).not.toHaveBeenCalled();
    expect(result).toEqual([{ value: 0n, asset: { type: "native" } }]);
  });

  it("converts balances above the exponential-notation threshold without loss", async () => {
    mockedFetchAccountStateInfo.mockResolvedValue({
      purseUref: FUNDED_ACCOUNT.purseUref,
      accountHash: FUNDED_ACCOUNT.accountHash,
    });
    mockedFetchBalance.mockResolvedValue(new BigNumber(EXPONENTIAL_NOTATION_THRESHOLD_MOTES));

    const result = await getBalance(FUNDED_ACCOUNT.publicKey);

    expect(result).toEqual([
      { value: BigInt(EXPONENTIAL_NOTATION_THRESHOLD_MOTES), asset: { type: "native" } },
    ]);
  });

  it("propagates errors from fetchBalance", async () => {
    mockedFetchAccountStateInfo.mockResolvedValue({
      purseUref: FUNDED_ACCOUNT.purseUref,
      accountHash: FUNDED_ACCOUNT.accountHash,
    });
    mockedFetchBalance.mockRejectedValue(new Error("state root hash unavailable"));

    await expect(getBalance(FUNDED_ACCOUNT.publicKey)).rejects.toThrow(
      "state root hash unavailable",
    );
  });
});

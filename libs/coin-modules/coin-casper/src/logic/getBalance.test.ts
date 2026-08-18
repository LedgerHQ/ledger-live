import BigNumber from "bignumber.js";
import { createMockAccount } from "../__tests__/fixtures/account.fixture";
import {
  casperMainnetResolvedConfig,
  createMockContext,
} from "../__tests__/fixtures/config.fixture";
import { CASPER_DUMMY_ADDRESS } from "../constants";
import { fetchAccountStateInfo, fetchBalance } from "../network/api";
import { getBalance } from "./getBalance";

const context = createMockContext();

jest.mock("../network/api", () => ({
  fetchAccountStateInfo: jest.fn(),
  fetchBalance: jest.fn(),
}));

const mockedFetchAccountStateInfo = jest.mocked(fetchAccountStateInfo);
const mockedFetchBalance = jest.mocked(fetchBalance);

const FUNDED_ACCOUNT = createMockAccount();
const FUNDED_ACCOUNT_STATE = {
  accountHash: "account-hash-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  purseUref: "uref-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef-007",
};
const FUNDED_ACCOUNT_MOTES = FUNDED_ACCOUNT.balance.toFixed(0);

const EXPONENTIAL_NOTATION_THRESHOLD_MOTES = "1000000000000000000000"; // 1e21

describe("getBalance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the native CSPR balance for a funded account", async () => {
    mockedFetchAccountStateInfo.mockResolvedValue(FUNDED_ACCOUNT_STATE);
    mockedFetchBalance.mockResolvedValue(new BigNumber(FUNDED_ACCOUNT_MOTES));

    const result = await getBalance(context, FUNDED_ACCOUNT.freshAddress);

    expect(mockedFetchAccountStateInfo).toHaveBeenCalledTimes(1);
    expect(mockedFetchAccountStateInfo).toHaveBeenCalledWith(
      casperMainnetResolvedConfig,
      FUNDED_ACCOUNT.freshAddress,
    );
    expect(mockedFetchBalance).toHaveBeenCalledTimes(1);
    expect(mockedFetchBalance).toHaveBeenCalledWith(
      casperMainnetResolvedConfig,
      FUNDED_ACCOUNT_STATE.purseUref,
    );
    expect(result).toEqual([{ value: BigInt(FUNDED_ACCOUNT_MOTES), asset: { type: "native" } }]);
  });

  it("returns a zero native balance when the account has no main purse", async () => {
    mockedFetchAccountStateInfo.mockResolvedValue({
      purseUref: undefined,
      accountHash: undefined,
    });

    const result = await getBalance(context, CASPER_DUMMY_ADDRESS);

    expect(mockedFetchBalance).not.toHaveBeenCalled();
    expect(result).toEqual([{ value: 0n, asset: { type: "native" } }]);
  });

  it("converts balances above the exponential-notation threshold without loss", async () => {
    mockedFetchAccountStateInfo.mockResolvedValue(FUNDED_ACCOUNT_STATE);
    mockedFetchBalance.mockResolvedValue(new BigNumber(EXPONENTIAL_NOTATION_THRESHOLD_MOTES));

    const result = await getBalance(context, FUNDED_ACCOUNT.freshAddress);

    expect(result).toEqual([
      { value: BigInt(EXPONENTIAL_NOTATION_THRESHOLD_MOTES), asset: { type: "native" } },
    ]);
  });

  it("propagates errors from fetchBalance", async () => {
    mockedFetchAccountStateInfo.mockResolvedValue(FUNDED_ACCOUNT_STATE);
    mockedFetchBalance.mockRejectedValue(new Error("state root hash unavailable"));

    await expect(getBalance(context, FUNDED_ACCOUNT.freshAddress)).rejects.toThrow(
      "state root hash unavailable",
    );
  });
});

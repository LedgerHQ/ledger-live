import BigNumber from "bignumber.js";
import { accountNamesCache, getTronAccountNetwork } from "../network";
import { NetworkInfo, Transaction, TronAccount } from "../types";
import { prepareTransaction } from "./prepareTransaction";

jest.mock("../network", () => ({
  getTronAccountNetwork: jest.fn(),
  accountNamesCache: jest.fn(),
}));

const mockGetTronAccountNetwork = jest.mocked(getTronAccountNetwork);
const mockAccountNamesCache = jest.mocked(accountNamesCache);

const baseNetworkInfo: NetworkInfo = {
  family: "tron",
  freeNetUsed: new BigNumber(1),
  freeNetLimit: new BigNumber(2),
  netUsed: new BigNumber(3),
  netLimit: new BigNumber(4),
  energyUsed: new BigNumber(5),
  energyLimit: new BigNumber(6),
};

const createTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  family: "tron",
  mode: "send",
  resource: "BANDWIDTH",
  networkInfo: undefined,
  duration: null,
  votes: [],
  amount: new BigNumber(0),
  recipient: "mock-recipient",
  ...overrides,
});

const createAccount = (overrides: Partial<TronAccount> = {}): TronAccount =>
  ({
    freshAddress: "TMockFreshAddress",
    ...overrides,
  }) as TronAccount;

describe("prepareTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the same transaction when networkInfo is already set", async () => {
    const account = createAccount();
    const transaction = createTransaction({ networkInfo: baseNetworkInfo });

    const result = await prepareTransaction(account, transaction);

    expect(result).toBe(transaction);
    expect(mockGetTronAccountNetwork).not.toHaveBeenCalled();
  });

  it("should fetch network info when networkInfo is missing", async () => {
    const account = createAccount({ freshAddress: "TAddr123" });
    const transaction = createTransaction({ networkInfo: undefined });
    mockGetTronAccountNetwork.mockResolvedValue(baseNetworkInfo);

    const result = await prepareTransaction(account, transaction);

    expect(mockGetTronAccountNetwork).toHaveBeenCalledTimes(1);
    expect(mockGetTronAccountNetwork).toHaveBeenCalledWith("TAddr123");
    expect(result).not.toBe(transaction);
    expect(result.networkInfo).toEqual(baseNetworkInfo);
  });

  it("should enrich vote names using accountNamesCache when votes are present", async () => {
    const account = createAccount();
    const voteAddress = "TVoteAddr";
    const transaction = createTransaction({
      networkInfo: baseNetworkInfo,
      votes: [{ address: voteAddress, voteCount: 100, name: undefined }],
    });
    mockAccountNamesCache.mockResolvedValue("SR name");

    const result = await prepareTransaction(account, transaction);

    expect(mockAccountNamesCache).toHaveBeenCalledWith(voteAddress);
    expect(result.votes).toEqual([{ address: voteAddress, voteCount: 100, name: "SR name" }]);
  });

  it("should enrich multiple votes in parallel", async () => {
    const account = createAccount();
    const transaction = createTransaction({
      networkInfo: baseNetworkInfo,
      votes: [
        { address: "TA", voteCount: 1, name: undefined },
        { address: "TB", voteCount: 2, name: undefined },
      ],
    });
    mockAccountNamesCache.mockImplementation(async addr => (addr === "TA" ? "Name A" : "Name B"));

    await prepareTransaction(account, transaction);

    expect(mockAccountNamesCache).toHaveBeenCalledTimes(2);
    expect(mockAccountNamesCache).toHaveBeenCalledWith("TA");
    expect(mockAccountNamesCache).toHaveBeenCalledWith("TB");
  });

  it("should not call accountNamesCache when there are no votes", async () => {
    const account = createAccount();
    const transaction = createTransaction({
      networkInfo: baseNetworkInfo,
      votes: [],
    });

    await prepareTransaction(account, transaction);

    expect(mockAccountNamesCache).not.toHaveBeenCalled();
  });
});

import { apiClient } from "../network/api";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import {
  getMockedAccountPublicTransactions,
  testnetAddress as address,
} from "../__tests__/fixtures/api.fixture";
import type { AleoContext } from "../types";
import { getAccountStatus } from "./getAccountStatus";

jest.mock("../network/api");

const mockGetAccountBalance = jest.mocked(apiClient.getAccountBalance);
const mockGetAccountPublicTransactions = jest.mocked(apiClient.getAccountPublicTransactions);

const config = getMockedConfig("mainnet");
const context: AleoContext = { config: async () => config, logger: () => {} };

const transactionsPage = (count: number) =>
  getMockedAccountPublicTransactions(address, count === 0 ? { transactions: [] } : {});

describe("getAccountStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reads an account with no balance and no transaction as unused", async () => {
    mockGetAccountBalance.mockResolvedValue(null);
    mockGetAccountPublicTransactions.mockResolvedValue(transactionsPage(0));

    await expect(getAccountStatus(context, address)).resolves.toEqual({ used: false });
  });

  it("reads an account with a public balance as used", async () => {
    mockGetAccountBalance.mockResolvedValue("10u64");
    mockGetAccountPublicTransactions.mockResolvedValue(transactionsPage(0));

    await expect(getAccountStatus(context, address)).resolves.toEqual({ used: true });
  });

  it("reads an emptied account with a public transaction as used", async () => {
    mockGetAccountBalance.mockResolvedValue("0u64");
    mockGetAccountPublicTransactions.mockResolvedValue(transactionsPage(1));

    await expect(getAccountStatus(context, address)).resolves.toEqual({ used: true });
  });

  it("asks nothing once aborted", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      getAccountStatus({ ...context, signal: controller.signal }, address),
    ).rejects.toBeDefined();
    expect(mockGetAccountBalance).not.toHaveBeenCalled();
  });

  it("drops what it read once aborted meanwhile", async () => {
    const controller = new AbortController();
    mockGetAccountBalance.mockImplementation(async () => {
      controller.abort();
      return "10u64";
    });
    mockGetAccountPublicTransactions.mockResolvedValue(transactionsPage(0));

    await expect(
      getAccountStatus({ ...context, signal: controller.signal }, address),
    ).rejects.toBeDefined();
  });
});

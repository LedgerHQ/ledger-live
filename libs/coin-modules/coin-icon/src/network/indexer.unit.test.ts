import network from "@ledgerhq/live-network/network";
import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";

import { getAccount, getCurrentBlockHeight, getTxHistory } from "./indexer";
import { getCoinConfig } from "../config";
import { LIMIT } from "../constants";
import { isTestnet } from "../logic";

jest.mock("@ledgerhq/live-network/network");
jest.mock("../logic");
jest.mock("../config");
jest.mock("@ledgerhq/logs");

describe("ICON API", () => {
  const networkMock = network as jest.Mock;
  const isTestnetMock = isTestnet as jest.Mock;
  const getCoinConfigMock = getCoinConfig as jest.Mock;
  const currency = { id: "icon" } as CryptoCurrency;
  const addr = "hx123";

  beforeEach(() => {
    jest.clearAllMocks();
    isTestnetMock.mockReturnValue(false);
    getCoinConfigMock.mockReturnValue({
      infra: {
        indexer: "mainnet-url",
        indexer_testnet: "testnet-url",
      },
    });
  });

  describe("getTxHistory", () => {
    it("requests the transactions of the address with the default limit", async () => {
      const transactions = [{ hash: "tx1" }];
      networkMock.mockResolvedValue({ data: transactions });

      const result = await getTxHistory(addr, 0, currency);

      expect(result).toEqual(transactions);
      expect(networkMock).toHaveBeenCalledWith({
        method: "GET",
        url: `mainnet-url/transactions/address/${addr}?skip=0&limit=${LIMIT}`,
      });
    });

    it("requests the testnet indexer with the given skip and limit", async () => {
      isTestnetMock.mockReturnValue(true);
      networkMock.mockResolvedValue({ data: [] });

      await getTxHistory(addr, 20, currency, 10);

      expect(networkMock).toHaveBeenCalledWith({
        method: "GET",
        url: `testnet-url/transactions/address/${addr}?skip=20&limit=10`,
      });
    });

    it("throws the error returned by the indexer", async () => {
      networkMock.mockResolvedValue({ data: { Error: "indexer failure" } });

      await expect(getTxHistory(addr, 0, currency)).rejects.toThrow("indexer failure");
    });
  });

  describe("getAccount", () => {
    it("returns the account details", async () => {
      const account = { address: addr, balance: 1 };
      networkMock.mockResolvedValue({ data: account });

      const result = await getAccount(addr, currency);

      expect(result).toEqual(account);
      expect(networkMock).toHaveBeenCalledWith({
        method: "GET",
        url: `mainnet-url/addresses/details/${addr}`,
      });
    });
  });

  describe("getCurrentBlockHeight", () => {
    it("returns the number of the latest block", async () => {
      networkMock.mockResolvedValue({ data: [{ number: 42 }, { number: 41 }] });

      const result = await getCurrentBlockHeight(currency);

      expect(result).toBe(42);
      expect(networkMock).toHaveBeenCalledWith({ method: "GET", url: "mainnet-url/blocks" });
    });
  });
});

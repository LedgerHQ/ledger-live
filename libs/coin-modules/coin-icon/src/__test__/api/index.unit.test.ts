import network from "@ledgerhq/live-network/network";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

import { fetchOperationList } from "../../api";
import { IconTransactionType } from "../../api/api-type";
import { isTestnet } from "../../logic";
import { getCoinConfig } from "../../config";
import querystring from "querystring";
import * as contants from "../../constants";

// Mock the necessary modules and functions
jest.mock("@ledgerhq/live-network/network");
jest.mock("@ledgerhq/coin-framework/operation");
jest.mock("@ledgerhq/cryptoassets");
jest.mock("../../logic");
jest.mock("../../config");
jest.mock("querystring");
jest.mock("@ledgerhq/logs");

describe("ICON API", () => {
  const networkMock = network as jest.Mock;
  const isTestnetMock = isTestnet as jest.Mock;
  const getCoinConfigMock = getCoinConfig as jest.Mock;
  const querystringMock = querystring.stringify as jest.Mock;
  const mockedLogic = jest.mocked(contants);

  isTestnetMock.mockReturnValue(true);
  getCoinConfigMock.mockReturnValue({
    infra: {
      indexer: "mainnet-url",
      indexer_testnet: "testnet-url",
    },
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchOperationList", () => {
    it("should recursively fetch operation list correctly", async () => {
      const accountId = "accountId";
      const addr = "hx123";
      const skip = 0;
      const network = { id: "icon" } as CryptoCurrency;
      const maxLength = 10;
      // @ts-expect-error type
      mockedLogic.LIMIT = 10;

      const tx1 = {
        hash: "tx1",
        from_address: addr,
        to_address: "hx456",
        transaction_fee: "10",
        block_number: 12345,
        block_timestamp: 1609459200000,
        status: "0x1",
        value: "1000",
      } as IconTransactionType;
      const tx2 = {
        hash: "tx2",
        from_address: "hx456",
        to_address: addr,
        transaction_fee: "5",
        block_number: 12346,
        block_timestamp: 1609459201000,
        status: "0x1",
        value: "2000",
      } as IconTransactionType;
      const txHistory = [tx1, tx2];
      querystringMock.mockReturnValue("address=hx123&skip=0&limit=10");
      networkMock.mockResolvedValue({ data: txHistory });

      const result = await fetchOperationList(accountId, addr, skip, network, maxLength);
      expect(result.length).toBe(2);
      expect(networkMock).toHaveBeenCalledWith({
        method: "GET",
        url: `testnet-url/transactions/address/${addr}?address=${addr}&skip=${skip}&limit=${10}`,
      });
    });
    it("should recursively fetch operation list correctly", async () => {
      const accountId = "accountId";
      const addr = "hx123";
      const skip = 0;
      const network = { id: "icon" } as CryptoCurrency;
      const maxLength = 10;
      // @ts-expect-error type
      mockedLogic.LIMIT = 2; // set a small limit for easier testing

      const tx1 = {
        hash: "tx1",
        from_address: addr,
        to_address: "hx456",
        transaction_fee: "10",
        block_number: 12345,
        block_timestamp: 1609459200000,
        status: "0x1",
        value: "1000",
      } as IconTransactionType;
      const tx2 = {
        hash: "tx2",
        from_address: "hx456",
        to_address: addr,
        transaction_fee: "5",
        block_number: 12346,
        block_timestamp: 1609459201000,
        status: "0x1",
        value: "2000",
      } as IconTransactionType;
      const tx3 = {
        hash: "tx3",
        from_address: addr,
        to_address: "hx456",
        transaction_fee: "15",
        block_number: 12347,
        block_timestamp: 1609459202000,
        status: "0x1",
        value: "1500",
      } as IconTransactionType;

      networkMock
        .mockResolvedValueOnce({ data: [tx1, tx2] }) // First fetch returns two transactions
        .mockResolvedValueOnce({ data: [tx3] }); // Second fetch returns one transaction

      querystringMock
        .mockReturnValueOnce("address=hx123&skip=0&limit=2")
        .mockReturnValueOnce("address=hx123&skip=2&limit=2");

      const result = await fetchOperationList(accountId, addr, skip, network, maxLength);

      // Verify that the function was called recursively
      expect(networkMock).toHaveBeenCalledTimes(2);

      // Verify that the result includes all transactions fetched
      expect(result.length).toBe(3);
      expect(result).toEqual([
        expect.objectContaining({ hash: "tx1" }),
        expect.objectContaining({ hash: "tx2" }),
        expect.objectContaining({ hash: "tx3" }),
      ]);

      // Verify the URLs used in the network calls
      expect(networkMock).toHaveBeenCalledWith({
        method: "GET",
        url: `testnet-url/transactions/address/${addr}?address=${addr}&skip=${skip}&limit=${2}`,
      });
      expect(networkMock).toHaveBeenCalledWith({
        method: "GET",
        url: `testnet-url/transactions/address/${addr}?address=${addr}&skip=${skip + 2}&limit=${2}`,
      });
    });
  });
});

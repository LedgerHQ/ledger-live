import { estimateFee, fetchAccountInfo } from "../../bridge/bridgeHelpers/api";
import { setCoinConfig } from "../../config";
import prepareTransaction from "../../prepareTransaction";
import mockServer, { API_TON_ENDPOINT } from "../fixtures/api.fixtures";
import {
  account,
  accountInfo,
  transaction as baseTransaction,
  fees,
  jettonTransaction,
  totalFees,
} from "../fixtures/common.fixtures";

jest.mock("../../bridge/bridgeHelpers/api");

describe("prepareTransaction", () => {
  beforeAll(() => {
    const fetchAccountInfoMock = jest.mocked(fetchAccountInfo);
    fetchAccountInfoMock.mockReturnValue(Promise.resolve(accountInfo));
    const fetchEstimateFeeMock = jest.mocked(estimateFee);
    fetchEstimateFeeMock.mockReturnValue(Promise.resolve(fees));

    setCoinConfig(() => ({
      status: {
        type: "active",
      },
      infra: {
        API_TON_ENDPOINT: API_TON_ENDPOINT,
        KNOWN_JETTONS: [],
      },
    }));
    mockServer.listen();
  });

  afterAll(() => {
    mockServer.close();
  });

  describe("Ton Transaction", () => {
    it("should return the transaction with the updated amount and fees", async () => {
      const transaction = await prepareTransaction(account, baseTransaction);

      expect(transaction).toEqual({
        ...baseTransaction,
        fees: totalFees,
      });
    });

    it("should preserve the reference when no change is detected on the transaction", async () => {
      const transaction = await prepareTransaction(account, { ...baseTransaction });
      const transaction2 = await prepareTransaction(account, transaction);

      expect(transaction).toBe(transaction2);
    });

    it("should create a coin transaction using the spendableBalance in the account", async () => {
      const transaction = await prepareTransaction(account, {
        ...baseTransaction,
        useAllAmount: true,
      });

      expect(transaction).toEqual({
        ...baseTransaction,
        useAllAmount: true,
        fees: totalFees,
        amount: account.spendableBalance.minus(totalFees),
      });
    });
  });

  describe("Jetton Transaction", () => {
    it("should return the transaction with the updated amount and fees", async () => {
      const transaction = await prepareTransaction(account, jettonTransaction);

      expect(transaction).toEqual({
        ...jettonTransaction,
        fees: totalFees,
      });
    });

    it("should preserve the reference when no change is detected on the transaction", async () => {
      const transaction = await prepareTransaction(account, { ...jettonTransaction });
      const transaction2 = await prepareTransaction(account, transaction);

      expect(transaction).toBe(transaction2);
    });

    it("should create a coin transaction using the spendableBalance in the account", async () => {
      const transaction = await prepareTransaction(account, {
        ...jettonTransaction,
        useAllAmount: true,
      });

      expect(transaction).toEqual({
        ...jettonTransaction,
        useAllAmount: true,
        fees: totalFees,
        amount: account.subAccounts?.[0].spendableBalance,
      });
    });
  });
});

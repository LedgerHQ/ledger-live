import { fetchCoinDetailsForAccount } from "../../api/network";
import estimateMaxSpendable from "../../js-estimateMaxSpendable";
import { Transaction } from "../../types";
import {
  account,
  transaction as baseTransaction,
  coinDetailsForAccount,
} from "../fixtures/common.fixtures";

jest.mock("../../api/network");

describe("estimateMaxSpendable", () => {
  beforeAll(() => {
    const fetchCoinDetailsForAccountMock = jest.mocked(fetchCoinDetailsForAccount);
    fetchCoinDetailsForAccountMock.mockReturnValue(Promise.resolve(coinDetailsForAccount));
  });

  it("should return the max spendable for a Kadena transaction", async () => {
    const res = await estimateMaxSpendable({ account, transaction: baseTransaction });
    expect(res.toFixed()).toEqual("45759916771498");
  });

  it("should return the max spendable for a Kadena transaction when there is no transaction", async () => {
    const res = await estimateMaxSpendable({ account });
    expect(res.toFixed()).toEqual("45757616781498");
  });

  it("should return the max spendable for a Kadena transaction when the senderChainId is not present in the balance", async () => {
    const transaction = { ...baseTransaction, senderChainId: 2 } as Transaction;

    const res = await estimateMaxSpendable({ account, transaction });
    expect(res.toFixed()).toEqual("0");
  });

  it("should return the 0 if the balance minus the fee is less than 0", async () => {
    const fetchCoinDetailsForAccountMock = jest.mocked(fetchCoinDetailsForAccount);
    fetchCoinDetailsForAccountMock.mockReturnValue(Promise.resolve({ "0": "0" }));

    const res = await estimateMaxSpendable({ account, transaction: baseTransaction });
    expect(res.toFixed()).toEqual("0");
  });
});

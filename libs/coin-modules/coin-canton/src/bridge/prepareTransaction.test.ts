import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { craftTransaction } from "../logic/craftTransaction";
import { estimateFees } from "../logic/estimateFees";
import { createMockCoinConfigValue, createMockContext } from "../test/fixtures";
import { Transaction } from "../types";
import { prepareTransaction } from "./prepareTransaction";

jest.mock("../logic/craftTransaction");
jest.mock("../logic/estimateFees");

describe("prepareTransaction", () => {
  let estimateFeesSpy: jest.SpyInstance;
  let craftTransactionSpy: jest.SpyInstance;

  beforeEach(() => {
    estimateFeesSpy = jest.spyOn({ estimateFees }, "estimateFees");
    craftTransactionSpy = jest.spyOn({ craftTransaction }, "craftTransaction");
    craftTransactionSpy.mockReturnValue({ serializedTransaction: "serialized" });
  });

  it("should update fee field if it's different", async () => {
    const oldTx = { fee: new BigNumber(0) };
    estimateFeesSpy.mockResolvedValue(BigInt(1));
    const newTx = await prepareTransaction(
      createMockContext(),
      { currency: {} } as Account,
      oldTx as Transaction,
    );
    expect(newTx.fee).toEqual(new BigNumber(1));
  });

  describe("asset", () => {
    const account = { currency: { id: "canton_network" }, subAccounts: [] } as unknown as Account;
    const prepare = (transaction: Partial<Transaction>) =>
      prepareTransaction(createMockContext(), account, {
        fee: new BigNumber(0),
        tokenId: "",
        ...transaction,
      } as Transaction);

    beforeEach(() => estimateFeesSpy.mockResolvedValue(BigInt(1)));

    it("is CC when no token is chosen", async () => {
      expect((await prepare({})).tokenId).toBe(createMockCoinConfigValue().nativeInstrumentId);
    });

    it("is not CC when the chosen token account is gone", async () => {
      expect((await prepare({ subAccountId: "gone" })).tokenId).toBe("");
    });
  });
});

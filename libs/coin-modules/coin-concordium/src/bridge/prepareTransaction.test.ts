import BigNumber from "bignumber.js";
import { Account } from "@ledgerhq/types-live";
import { craftTransaction, estimateFees, getNextValidSequence } from "../common-logic";
import { Transaction } from "../types";
import { prepareTransaction } from "./prepareTransaction";

jest.mock("../common-logic");

describe("prepareTransaction", () => {
  let estimateFeesSpy: jest.SpyInstance;
  let getNextValidSequenceSpy: jest.SpyInstance;
  let craftTransactionSpy: jest.SpyInstance;
  beforeEach(() => {
    getNextValidSequenceSpy = jest.spyOn({ getNextValidSequence }, "getNextValidSequence");
    estimateFeesSpy = jest.spyOn({ estimateFees }, "estimateFees");
    craftTransactionSpy = jest.spyOn({ craftTransaction }, "craftTransaction");
    craftTransactionSpy.mockReturnValue({ serializedTransaction: "serialized" });
  });

  it("should update fee field if it's different", async () => {
    getNextValidSequenceSpy.mockResolvedValue(42);
    const mockAccount = {
      currency: { id: "concordium" },
      freshAddress: "3XSLuJcXg6xEua6iBPnWacc3iWh93yEDMCqX8FbE3RDSbEnT9P",
    } as Account;
    const oldTx = { fee: new BigNumber(0), amount: new BigNumber(1000) };
    estimateFeesSpy.mockResolvedValue({ cost: BigInt(1), energy: BigInt(501) });
    const newTx = await prepareTransaction(mockAccount, oldTx as Transaction);
    expect(newTx.fee).toEqual(new BigNumber(1));
  });
});

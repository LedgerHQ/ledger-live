import BigNumber from "bignumber.js";
import { craftTransaction, estimateFees } from "../common-logic";
import { getNextSequence } from "../network/node";
import { prepareTransaction } from "./prepareTransaction";
import { Account } from "@ledgerhq/types-live";
import { Transaction } from "../types";

jest.mock("../network/node");
jest.mock("../common-logic");

describe("prepareTransaction", () => {
  let estimateFeesSpy: jest.SpyInstance;
  let getNextSequenceSpy: jest.SpyInstance;
  let craftTransactionSpy: jest.SpyInstance;
  beforeEach(() => {
    getNextSequenceSpy = jest.spyOn({ getNextSequence }, "getNextSequence");
    estimateFeesSpy = jest.spyOn({ estimateFees }, "estimateFees");
    craftTransactionSpy = jest.spyOn({ craftTransaction }, "craftTransaction");
    craftTransactionSpy.mockReturnValue({ serializedTransaction: "serialized" });
  });

  it("should update fee field if it's different", async () => {
    const oldTx = { fee: new BigNumber(0) };
    estimateFeesSpy.mockResolvedValue(new BigNumber(1));
    const newTx = await prepareTransaction({} as Account, oldTx as Transaction);
    expect(newTx.fee).toEqual(new BigNumber(1));
  });
});

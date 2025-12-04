import BigNumber from "bignumber.js";
import { craftTransaction, estimateFees } from "../common-logic";
import { getNextSequence } from "../network/node";
import { createMockCantonAccount, setupMockCoinConfig } from "../test/fixtures";
import { Transaction } from "../types";
import { prepareTransaction } from "./prepareTransaction";

jest.mock("../network/node");
jest.mock("../common-logic");

describe("prepareTransaction", () => {
  let estimateFeesSpy: jest.SpyInstance;
  let getNextSequenceSpy: jest.SpyInstance;
  let craftTransactionSpy: jest.SpyInstance;

  beforeAll(async () => {
    setupMockCoinConfig();
  });
  beforeEach(() => {
    getNextSequenceSpy = jest.spyOn({ getNextSequence }, "getNextSequence");
    estimateFeesSpy = jest.spyOn({ estimateFees }, "estimateFees");
    craftTransactionSpy = jest.spyOn({ craftTransaction }, "craftTransaction");
    craftTransactionSpy.mockReturnValue({ serializedTransaction: "serialized" });
  });

  it("should update fee field if it's different", async () => {
    getNextSequenceSpy.mockResolvedValue(42);
    const oldTx = { fee: new BigNumber(0) };
    estimateFeesSpy.mockResolvedValue(BigInt(1));
    const newTx = await prepareTransaction(createMockCantonAccount(), oldTx as Transaction);
    expect(newTx.fee).toEqual(new BigNumber(1));
  });
});

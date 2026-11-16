import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { craftTransaction } from "../logic/craftTransaction";
import { estimateFees } from "../logic/estimateFees";
import { createMockContext } from "../test/fixtures";
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
});

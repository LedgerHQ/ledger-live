import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getNonce } from "../api";
import { Transaction } from "../types";
import estimateFees from "./getEstimatedFees";
import { prepareTransaction } from "./prepareTransaction";

jest.mock("../api");
jest.mock("./getEstimatedFees");

describe("prepareTransaction", () => {
  let estimateFeesSpy: jest.SpyInstance;
  let getNonceSpy: jest.SpyInstance;
  beforeEach(() => {
    getNonceSpy = jest.spyOn({ getNonce }, "getNonce");
    estimateFeesSpy = jest.spyOn({ estimateFees }, "estimateFees");
    estimateFeesSpy.mockResolvedValue({
      fee: new BigNumber(1),
      accountCreationFee: new BigNumber(1),
    });
    getNonceSpy.mockResolvedValue(1);
  });

  it("should update fee fields if it's different", async () => {
    const oldTx = {
      fees: { fee: new BigNumber(0), accountCreationFee: new BigNumber(0) },
    };
    const newTx = await prepareTransaction({} as Account, oldTx as Transaction);
    expect(newTx.fees.fee).toEqual(new BigNumber(1));
    expect(newTx.fees.accountCreationFee).toEqual(new BigNumber(1));
    expect(getNonceSpy).toHaveBeenCalledTimes(1);
    expect(getNonceSpy).toHaveBeenCalledWith(oldTx, undefined);
  });

  it("should update nonce if it's different", async () => {
    const oldTx = {
      nonce: 0,
      fees: { fee: new BigNumber(0), accountCreationFee: new BigNumber(0) },
    };
    const newTx = await prepareTransaction({} as Account, oldTx as Transaction);
    expect(newTx.nonce).toEqual(1);
  });
});

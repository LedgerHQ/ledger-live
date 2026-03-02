import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { craftTransaction, estimateFees } from "../common-logic";
import coinConfig from "../config";
import { Transaction } from "../types";
import { prepareTransaction } from "./prepareTransaction";

jest.mock("../common-logic");

describe("prepareTransaction", () => {
  let estimateFeesSpy: jest.SpyInstance;
  let craftTransactionSpy: jest.SpyInstance;

  beforeAll(async () => {
    coinConfig.setCoinConfig(() => ({
      gatewayUrl: "https://canton-gateway-devnet.api.live.ledger-test.com",
      useGateway: true,
      networkType: "devnet",
      nativeInstrumentId: "Amulet",
      status: {
        type: "active",
      },
    }));
  });
  beforeEach(() => {
    estimateFeesSpy = jest.spyOn({ estimateFees }, "estimateFees");
    craftTransactionSpy = jest.spyOn({ craftTransaction }, "craftTransaction");
    craftTransactionSpy.mockReturnValue({ serializedTransaction: "serialized" });
  });

  it("should update fee field if it's different", async () => {
    const oldTx = { fee: new BigNumber(0) };
    estimateFeesSpy.mockResolvedValue(BigInt(1));
    const newTx = await prepareTransaction({} as Account, oldTx as Transaction);
    expect(newTx.fee).toEqual(new BigNumber(1));
  });
});

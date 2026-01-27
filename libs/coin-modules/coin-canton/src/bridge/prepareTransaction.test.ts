import BigNumber from "bignumber.js";
import { craftTransaction, estimateFees } from "../common-logic";
import {
  createMockCantonAccount,
  createMockTransaction,
  setupMockCoinConfig,
} from "../test/fixtures";
import { prepareTransaction } from "./prepareTransaction";

jest.mock("../common-logic");

describe("prepareTransaction", () => {
  let craftTransactionSpy: jest.SpyInstance;
  let estimateFeesSpy: jest.SpyInstance;

  beforeAll(async () => {
    setupMockCoinConfig();
  });
  beforeEach(() => {
    craftTransactionSpy = jest.spyOn({ craftTransaction }, "craftTransaction");
    craftTransactionSpy.mockReturnValue({ serializedTransaction: "serialized" });
    estimateFeesSpy = jest.spyOn({ estimateFees }, "estimateFees");
  });

  it("should update fee field if it's different", async () => {
    const transaction = createMockTransaction({ fee: new BigNumber(0) });
    estimateFeesSpy.mockResolvedValue(BigInt(1));
    const preparedTransaction = await prepareTransaction(createMockCantonAccount(), transaction);
    expect(preparedTransaction.fee).toEqual(new BigNumber(1));
  });
});

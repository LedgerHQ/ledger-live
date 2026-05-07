import {
  TransactionIntent,
  MemoNotSupported,
  BufferTxData,
} from "@ledgerhq/coin-module-framework/api/types";
import * as commonModule from "./common";
import { craftTransactionData } from "./craftTransactionData";

jest.mock("./common", () => {
  const originalModule = jest.requireActual("./common");
  return {
    ...originalModule,
    getCallData: jest.fn(),
  };
});

describe("craftTransactionData", () => {
  it("should return a correct BufferTxData", () => {
    const expectedBuffer = Buffer.from("fake data for buffer");
    const getCallDataSpy = jest
      .spyOn(commonModule, "getCallData")
      .mockReturnValueOnce(expectedBuffer);

    const intent = {} as unknown as TransactionIntent<MemoNotSupported, BufferTxData>;
    const callData = craftTransactionData(intent);

    expect(callData).toEqual({
      value: expectedBuffer,
      type: "buffer",
    });

    expect(getCallDataSpy).toHaveBeenCalledTimes(1);
    expect(getCallDataSpy).toHaveBeenCalledWith(intent);
  });
});

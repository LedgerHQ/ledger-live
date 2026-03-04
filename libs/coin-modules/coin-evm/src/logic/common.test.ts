/* eslint-disable @typescript-eslint/consistent-type-assertions */

import { MemoNotSupported } from "@ledgerhq/coin-framework/api/index";
import { TransactionIntent, BufferTxData } from "@ledgerhq/coin-framework/api/types";
import { getCallData } from "./common";
import * as getErc20DataModule from "./getErc20Data";

jest.mock("./getErc20Data", () => {
  const actual = jest.requireActual<typeof import("./getErc20Data")>("./getErc20Data");
  return {
    getErc20Data: jest.fn((recipient: string, amount: bigint) =>
      actual.getErc20Data(recipient, amount),
    ),
  };
});

const getErc20DataMock = getErc20DataModule.getErc20Data as jest.Mock;

describe("common", () => {
  describe("getCallData", () => {
    beforeEach(() => {
      getErc20DataMock.mockClear();
    });

    it("should return data field from intent when available and not compute calldata", () => {
      const intent = {
        data: {
          value: Buffer.from(
            "a9059cbb000000000000000000000000d8ff72a08408b97655ee94381b8fa24ba7d6f5ac0000000000000000000000000000000000000000000000000000000000895440",
          ),
        },
      } as unknown as TransactionIntent<MemoNotSupported, BufferTxData>;
      const expectedResult = Buffer.from(intent.data.value);

      const result = getCallData(intent);
      expect(result).toEqual(expectedResult);
      expect(getErc20DataMock).not.toHaveBeenCalled();
    });

    it.each([
      {
        asset: {
          type: "native",
        },
      } as unknown as TransactionIntent<MemoNotSupported, BufferTxData>,
      {
        asset: {
          type: "erc20",
        },
      } as unknown as TransactionIntent<MemoNotSupported, BufferTxData>,
      {
        asset: {
          type: "erc20",
        },
        amount: 1n,
      } as unknown as TransactionIntent<MemoNotSupported, BufferTxData>,
    ])("should return empty buffer for invalid intent", intent => {
      const expectedResult = Buffer.from([]);
      const result = getCallData(intent);
      expect(result).toEqual(expectedResult);
      expect(getErc20DataMock).not.toHaveBeenCalled();
    });

    it("should return calldata from contract for non native asset with a recipient and an amount", () => {
      const recipient = "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3";
      const amount = 1n;

      const intent = {
        asset: { type: "erc20" },
        recipient,
        amount,
      } as unknown as TransactionIntent<MemoNotSupported, BufferTxData>;

      const expectedResult = Buffer.from(
        "a9059cbb00000000000000000000000066c4371ae8ffed2ec1c2ebbbccfb7e494181e1e30000000000000000000000000000000000000000000000000000000000000001",
        "hex",
      );

      const result = getCallData(intent);

      expect(getErc20DataMock).toHaveBeenCalledTimes(1);
      expect(getErc20DataMock).toHaveBeenCalledWith(recipient, amount);
      expect(result).toEqual(expectedResult);
    });
  });
});

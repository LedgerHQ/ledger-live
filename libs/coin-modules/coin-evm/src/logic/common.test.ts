/* eslint-disable @typescript-eslint/consistent-type-assertions */

import { MemoNotSupported } from "@ledgerhq/coin-framework/api/index";
import { TransactionIntent, BufferTxData } from "@ledgerhq/coin-framework/api/types";
import { getCallData, getErc20Data } from "./common";

describe("common", () => {
  describe("getCallData", () => {
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
      const result = getCallData(intent);
      expect(result).toEqual(Buffer.from([]));
    });

    it("should return calldata from contract for non native asset with a recipient and an amount", () => {
      const intent = {
        asset: {
          type: "erc20",
        },
        recipient: "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3",
        amount: 1n,
      } as unknown as TransactionIntent<MemoNotSupported, BufferTxData>;
      const expectedResult = Buffer.from(
        "a9059cbb00000000000000000000000066c4371ae8ffed2ec1c2ebbbccfb7e494181e1e30000000000000000000000000000000000000000000000000000000000000001",
        "hex",
      );

      const result = getCallData(intent);
      expect(result).toEqual(expectedResult);
    });
  });

  describe("getErc20Data", () => {
    it.each([
      {
        recipient: "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3",
        amount: 1n,
        expectedData:
          "a9059cbb00000000000000000000000066c4371ae8ffed2ec1c2ebbbccfb7e494181e1e30000000000000000000000000000000000000000000000000000000000000001",
      },
      {
        recipient: "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3",
        amount: 0n,
        expectedData:
          "a9059cbb00000000000000000000000066c4371ae8ffed2ec1c2ebbbccfb7e494181e1e30000000000000000000000000000000000000000000000000000000000000000",
      },
    ])("should return the correct buffer", ({ recipient, amount, expectedData }) => {
      const result = getErc20Data(recipient, amount);
      expect(result.toString("hex")).toEqual(expectedData);
    });

    it("should throw an error when recipient is empty", () => {
      expect(() => getErc20Data("", 1n)).toThrow("invalid address");
    });
  });
});

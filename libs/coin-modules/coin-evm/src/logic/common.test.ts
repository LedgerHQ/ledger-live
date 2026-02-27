/* eslint-disable @typescript-eslint/consistent-type-assertions */

import { MemoNotSupported } from "@ledgerhq/coin-framework/api/index";
import { TransactionIntent, BufferTxData } from "@ledgerhq/coin-framework/api/types";
import { getCallData } from "./common";

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

      const result = getCallData(intent);
      expect(result).toEqual(intent.data.value);
    });

    it("should return empty buffer for native asset", () => {
      const intent = {
        asset: {
          type: "native",
        },
      } as unknown as TransactionIntent<MemoNotSupported, BufferTxData>;

      const result = getCallData(intent);
      expect(result).toEqual(Buffer.from([]));
    });

    it("should return empty buffer for non native asset and no recipient", () => {
      const intent = {
        asset: {
          type: "erc20",
        },
      } as unknown as TransactionIntent<MemoNotSupported, BufferTxData>;

      const result = getCallData(intent);
      expect(result).toEqual(Buffer.from([]));
    });

    it("should return empty buffer for non native asset with recipient and no amount", () => {
      const intent = {
        asset: {
          type: "erc20",
        },
        recipient: "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3",
      } as unknown as TransactionIntent<MemoNotSupported, BufferTxData>;

      const result = getCallData(intent);
      expect(result).toEqual(Buffer.from([]));
    });

    it("should return calldata from contract for non native asset with a recipient", () => {
      const intent = {
        asset: {
          type: "erc20",
        },
        recipient: "0x66c4371aE8FFeD2ec1c2EBbbcCfb7E494181E1E3",
        amount: 1n,
      } as unknown as TransactionIntent<MemoNotSupported, BufferTxData>;

      const result = getCallData(intent);
      expect(result).toEqual(
        Buffer.from(
          "a9059cbb00000000000000000000000066c4371ae8ffed2ec1c2ebbbccfb7e494181e1e30000000000000000000000000000000000000000000000000000000000000001",
          "hex",
        ),
      );
    });
  });
});

import { ethers } from "ethers";
import { TxMapper } from "./TxMapper";
import LL from "@ledgerhq/coin-evm/types/index";
import BigNumber from "bignumber.js";

describe("TxMapper", () => {
  let mapper: TxMapper;

  beforeEach(() => {
    mapper = new TxMapper();
  });

  describe("isEthersv5Transaction", () => {
    const validTx: ethers.Transaction = {
      to: "0x1234567890123456789012345678901234567890",
      data: "0x1234567890",
      chainId: 1,
      nonce: 0,
      gasLimit: ethers.BigNumber.from(21000),
      gasPrice: ethers.BigNumber.from(1000000000),
      value: ethers.BigNumber.from(1000000),
    };

    it("should map ethersv5 transaction", () => {
      // GIVEN
      const tx: ethers.Transaction = validTx;

      // WHEN
      const result = mapper.mapTransaction(tx);

      // THEN
      expect(result.transactionRaw).toEqual(
        "eb80843b9aca00825208941234567890123456789012345678901234567890830f4240851234567890018080",
      );
      expect(result.transactionSubset).toEqual({
        to: "0x1234567890123456789012345678901234567890",
        data: "0x1234567890",
        chainId: 1,
      });
    });

    it("should map ethersv5 transaction without gasPrice", () => {
      // GIVEN
      const { gasPrice, ...tx } = validTx;

      // WHEN
      const result = mapper.mapTransaction(tx);

      // THEN
      expect(result.transactionRaw).toEqual(
        "e78080825208941234567890123456789012345678901234567890830f4240851234567890018080",
      );
      expect(result.transactionSubset).toEqual({
        to: "0x1234567890123456789012345678901234567890",
        data: "0x1234567890",
        chainId: 1,
      });
    });

    it("should map ethersv5 transaction without to", () => {
      // GIVEN
      const { to, ...tx } = validTx;

      // WHEN
      const result = mapper.mapTransaction(tx);

      // THEN
      expect(result.transactionRaw).toEqual("d780843b9aca0082520880830f4240851234567890018080");
      expect(result.transactionSubset).toEqual({
        to: undefined,
        data: "0x1234567890",
        chainId: 1,
      });
    });

    it("should map ethersv5 transaction without from", () => {
      // GIVEN
      const { from, ...tx } = validTx;

      // WHEN
      const result = mapper.mapTransaction(tx);

      // THEN
      expect(result.transactionRaw).toEqual(
        "eb80843b9aca00825208941234567890123456789012345678901234567890830f4240851234567890018080",
      );
      expect(result.transactionSubset).toEqual({
        to: "0x1234567890123456789012345678901234567890",
        data: "0x1234567890",
        chainId: 1,
      });
    });

    it("should throw error if type of from is not string", () => {
      // GIVEN
      const tx = {
        ...validTx,
        from: 123,
      } as unknown as ethers.Transaction;

      // WHEN
      const result = () => mapper.mapTransaction(tx);

      // THEN
      expect(result).toThrow("Invalid transaction type");
    });

    it("should throw error if to is not string", () => {
      // GIVEN
      const tx = {
        ...validTx,
        to: 123,
      } as unknown as ethers.Transaction;

      // WHEN
      const result = () => mapper.mapTransaction(tx);

      // THEN
      expect(result).toThrow("Invalid transaction type");
    });

    it("should throw error if nonce is not number", () => {
      // GIVEN
      const tx = {
        ...validTx,
        nonce: "0",
      } as unknown as ethers.Transaction;

      // WHEN
      const result = () => mapper.mapTransaction(tx);

      // THEN
      expect(result).toThrow("Invalid transaction type");
    });

    it("should throw error if gasLimit is not BigNumber", () => {
      // GIVEN
      const tx = {
        ...validTx,
        gasLimit: "21000",
      } as unknown as ethers.Transaction;

      // WHEN
      const result = () => mapper.mapTransaction(tx);

      // THEN
      expect(result).toThrow("Invalid transaction type");
    });

    it("should throw error if gasPrice is not BigNumber", () => {
      // GIVEN
      const tx = {
        ...validTx,
        gasPrice: "1000000000",
      } as unknown as ethers.Transaction;

      // WHEN
      const result = () => mapper.mapTransaction(tx);

      // THEN
      expect(result).toThrow("Invalid transaction type");
    });

    it("should throw error if data is not string", () => {
      // GIVEN
      const tx = {
        ...validTx,
        data: 123,
      } as unknown as ethers.Transaction;

      // WHEN
      const result = () => mapper.mapTransaction(tx);

      // THEN
      expect(result).toThrow("Invalid transaction type");
    });

    it("should throw error if value is not BigNumber", () => {
      // GIVEN
      const tx = {
        ...validTx,
        value: "1000000",
      } as unknown as ethers.Transaction;

      // WHEN
      const result = () => mapper.mapTransaction(tx);

      // THEN
      expect(result).toThrow("Invalid transaction type");
    });

    it("should throw error if chainId is not number", () => {
      // GIVEN
      const tx = {
        ...validTx,
        chainId: "1",
      } as unknown as ethers.Transaction;

      // WHEN
      const result = () => mapper.mapTransaction(tx);

      // THEN
      expect(result).toThrow("Invalid transaction type");
    });
  });

  describe("isLLTransaction", () => {
    const validTx: LL.Transaction = {
      recipient: "0x1234567890123456789012345678901234567890",
      data: Buffer.from("1234567890", "hex"),
      chainId: 1,
      amount: new BigNumber(1000000),
      nonce: 0,
      gasLimit: new BigNumber(21000),
      gasPrice: new BigNumber(1000000000),
      family: "evm",
      mode: "send",
    };

    it("should map LL transaction", () => {
      // GIVEN
      const tx: LL.Transaction = validTx;

      // WHEN
      const result = mapper.mapTransaction(tx);

      // THEN
      expect(result.transactionRaw).toEqual(
        "eb80843b9aca00825208941234567890123456789012345678901234567890830f4240851234567890018080",
      );
      expect(result.transactionSubset).toEqual({
        to: "0x1234567890123456789012345678901234567890",
        data: "1234567890",
        chainId: 1,
      });
    });

    it("should map a LL transaction without data", () => {
      // GIVEN
      const { data, ...tx } = validTx;

      // WHEN
      const result = mapper.mapTransaction(tx);

      // THEN
      expect(result.transactionRaw).toEqual(
        "e680843b9aca00825208941234567890123456789012345678901234567890830f424080018080",
      );
      expect(result.transactionSubset).toEqual({
        to: "0x1234567890123456789012345678901234567890",
        data: undefined,
        chainId: 1,
      });
    });

    it("should throw error if recipient is not string", () => {
      // GIVEN
      const tx = {
        ...validTx,
        recipient: 123,
      } as unknown as LL.Transaction;

      // WHEN
      const result = () => mapper.mapTransaction(tx);

      // THEN
      expect(result).toThrow("Invalid transaction type");
    });

    it("should throw error if amount is not a bignumber", () => {
      // GIVEN
      const tx = {
        ...validTx,
        amount: 1000000,
      } as unknown as LL.Transaction;

      // WHEN
      const result = () => mapper.mapTransaction(tx);

      // THEN
      expect(result).toThrow("Invalid transaction type");
    });

    it("should throw error if gasLimit is not a bignumber", () => {
      // GIVEN
      const tx = {
        ...validTx,
        gasLimit: 21000,
      } as unknown as LL.Transaction;

      // WHEN
      const result = () => mapper.mapTransaction(tx);

      // THEN
      expect(result).toThrow("Invalid transaction type");
    });

    it("should throw error if gasPrice is not a bignumber", () => {
      // GIVEN
      const tx = {
        ...validTx,
        gasPrice: 1000000000,
      } as unknown as LL.Transaction;

      // WHEN
      const result = () => mapper.mapTransaction(tx);

      // THEN
      expect(result).toThrow("Invalid transaction type");
    });

    it("should throw error if chainId is not number", () => {
      // GIVEN
      const tx = {
        ...validTx,
        chainId: "1",
      } as unknown as LL.Transaction;

      // WHEN
      const result = () => mapper.mapTransaction(tx);

      // THEN
      expect(result).toThrow("Invalid transaction type");
    });

    it("should throw error if data is not a buffer", () => {
      // GIVEN
      const tx = {
        ...validTx,
        data: "1234567890",
      } as unknown as LL.Transaction;

      // WHEN
      const result = () => mapper.mapTransaction(tx);

      // THEN
      expect(result).toThrow("Invalid transaction type");
    });

    it("should throw error if nonce is not number", () => {
      // GIVEN
      const tx = {
        ...validTx,
        nonce: "0",
      } as unknown as LL.Transaction;

      // WHEN
      const result = () => mapper.mapTransaction(tx);

      // THEN
      expect(result).toThrow("Invalid transaction type");
    });

    it("should throw error if family is not evm", () => {
      // GIVEN
      const tx = {
        ...validTx,
        family: "btc",
      } as unknown as LL.Transaction;

      // WHEN
      const result = () => mapper.mapTransaction(tx);

      // THEN
      expect(result).toThrow("Invalid transaction type");
    });

    it("should throw error if mode is not send", () => {
      // GIVEN
      const tx = {
        ...validTx,
        mode: "receive",
      } as unknown as LL.Transaction;

      // WHEN
      const result = () => mapper.mapTransaction(tx);

      // THEN
      expect(result).toThrow("Invalid transaction type");
    });
  });
});

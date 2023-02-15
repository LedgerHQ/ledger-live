import BigNumber from "bignumber.js";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { createTransaction } from "../createTransaction";
import { makeAccount } from "../testUtils";

const currencyWithChainId = getCryptoCurrencyById("ethereum");
const currencyWithoutChainId = {
  ...currencyWithChainId,
  ethereumLikeInfo: {},
} as CryptoCurrency;
const account1 = makeAccount("0xkvn", currencyWithoutChainId);
const account2 = makeAccount("0xkvn", currencyWithChainId);

describe("EVM Family", () => {
  describe("createTransaction.ts", () => {
    it("should create a valid transaction", () => {
      const transaction1 = createTransaction(account1);
      const transaction2 = createTransaction(account2);

      expect(transaction1).toEqual({
        family: "evm",
        mode: "send",
        amount: new BigNumber(0),
        useAllAmount: false,
        recipient: "",
        maxFeePerGas: new BigNumber(0),
        maxPriorityFeePerGas: new BigNumber(0),
        gasLimit: new BigNumber(21000),
        nonce: 1,
        chainId: 0,
        feesStrategy: "medium",
        type: 2,
      });

      expect(transaction2).toEqual({
        family: "evm",
        mode: "send",
        amount: new BigNumber(0),
        useAllAmount: false,
        recipient: "",
        maxFeePerGas: new BigNumber(0),
        maxPriorityFeePerGas: new BigNumber(0),
        gasLimit: new BigNumber(21000),
        nonce: 1,
        chainId: 1,
        feesStrategy: "medium",
        type: 2,
      });
    });
  });
});

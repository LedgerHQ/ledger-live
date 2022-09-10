import BigNumber from "bignumber.js";
import { Account } from "@ledgerhq/types-live";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { EvmTransactionEIP1559, EvmTransactionLegacy } from "../types";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { getEstimatedFees } from "../logic";
import { makeAccount } from "../testUtils";

const account: Account = {
  ...makeAccount("0xkvn", findCryptoCurrencyById("ethereum")!),
  balance: new BigNumber(42069000000),
};
const eip1559Tx: EvmTransactionEIP1559 = {
  amount: new BigNumber(100),
  useAllAmount: false,
  recipient: "0xkvn",
  family: "evm",
  mode: "send",
  nonce: 0,
  gasLimit: new BigNumber(21000),
  chainId: 1,
  maxFeePerGas: new BigNumber(10000),
  maxPriorityFeePerGas: new BigNumber(10000),
  type: 2,
};
const legacyTx: EvmTransactionLegacy = {
  amount: new BigNumber(100),
  useAllAmount: false,
  recipient: "0xkvn",
  family: "evm",
  mode: "send",
  nonce: 0,
  gasLimit: new BigNumber(21000),
  chainId: 1,
  gasPrice: new BigNumber(10000),
  type: 0,
};

describe("EVM Family", () => {
  describe("estimateMaxSpendable.ts", () => {
    it("should get a max spendable of the account balance minus the EIP1559 tx", async () => {
      const amount = await estimateMaxSpendable({
        account,
        transaction: eip1559Tx,
      });
      const estimatedFees = getEstimatedFees(eip1559Tx);

      expect(amount).toEqual(account.balance.minus(estimatedFees));
    });

    it("should get a max spendable of the account balance minus the legacy tx", async () => {
      const amount = await estimateMaxSpendable({
        account,
        transaction: legacyTx,
      });
      const estimatedFees = getEstimatedFees(legacyTx);

      expect(amount).toEqual(account.balance.minus(estimatedFees));
    });
  });
});

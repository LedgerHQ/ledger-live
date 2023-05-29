import BigNumber from "bignumber.js";
import { getCryptoCurrencyById, getTokenById } from "@ledgerhq/cryptoassets";
import { EvmTransactionEIP1559, EvmTransactionLegacy } from "../types";
import { estimateMaxSpendable } from "../estimateMaxSpendable";
import { makeAccount, makeTokenAccount } from "../testUtils";
import * as rpcAPI from "../api/rpc.common";

const tokenAccount = {
  ...makeTokenAccount("0xkvn", getTokenById("ethereum/erc20/usd__coin")),
  balance: new BigNumber(6969),
};
const account = {
  ...makeAccount("0xkvn", getCryptoCurrencyById("ethereum"), [tokenAccount]),
  balance: new BigNumber(42069000000),
};

jest
  .spyOn(rpcAPI, "getGasEstimation")
  .mockImplementation(async () => new BigNumber(21000));
jest.spyOn(rpcAPI, "getFeesEstimation").mockImplementation(async () => ({
  gasPrice: new BigNumber(10000),
  maxFeePerGas: new BigNumber(10000),
  maxPriorityFeePerGas: new BigNumber(0),
}));

describe("EVM Family", () => {
  describe("estimateMaxSpendable.ts", () => {
    it("should get a max spendable of the account balance minus the EIP1559 coin tx", async () => {
      const eip1559Tx: EvmTransactionEIP1559 = {
        amount: new BigNumber(100),
        useAllAmount: false,
        recipient: "0xlmb",
        family: "evm",
        mode: "send",
        nonce: 0,
        gasLimit: new BigNumber(0),
        chainId: 1,
        maxFeePerGas: new BigNumber(0),
        maxPriorityFeePerGas: new BigNumber(0),
        type: 2,
      };
      const amount = await estimateMaxSpendable({
        account,
        transaction: eip1559Tx,
      });
      const gasLimit = await rpcAPI.getGasEstimation(account, eip1559Tx);
      const { maxFeePerGas } = await rpcAPI.getFeesEstimation(account.currency);
      const estimatedFees = gasLimit.times(maxFeePerGas!);
      expect(amount).toEqual(account.balance.minus(estimatedFees));
    });

    it("should get a max spendable of the account balance minus the legacy coin tx", async () => {
      const legacyTx: EvmTransactionLegacy = {
        amount: new BigNumber(100),
        useAllAmount: false,
        recipient: "0xlmb",
        family: "evm",
        mode: "send",
        nonce: 0,
        gasLimit: new BigNumber(0),
        chainId: 1,
        gasPrice: new BigNumber(0),
        type: 0,
      };
      const amount = await estimateMaxSpendable({
        account,
        transaction: legacyTx,
      });
      const gasLimit = await rpcAPI.getGasEstimation(account, legacyTx);
      const { gasPrice } = await rpcAPI.getFeesEstimation(account.currency);
      const estimatedFees = gasLimit.times(gasPrice!);
      expect(amount).toEqual(account.balance.minus(estimatedFees));
    });

    it("should get a max spendable of the account balance minus the EIP1559 token tx", async () => {
      const eip1559Tx: EvmTransactionEIP1559 = {
        amount: new BigNumber(100),
        useAllAmount: false,
        recipient: "0xlmb",
        family: "evm",
        mode: "send",
        nonce: 0,
        gasLimit: new BigNumber(0),
        chainId: 1,
        maxFeePerGas: new BigNumber(0),
        maxPriorityFeePerGas: new BigNumber(0),
        subAccountId: tokenAccount.id,
        type: 2,
      };

      const amount = await estimateMaxSpendable({
        account: tokenAccount,
        parentAccount: account,
        transaction: eip1559Tx,
      });

      expect(amount).toEqual(tokenAccount.balance);
    });

    it("should get a max spendable of the account balance minus the legacy token tx", async () => {
      const legacyTx: EvmTransactionLegacy = {
        amount: new BigNumber(100),
        useAllAmount: false,
        recipient: "0xlmb",
        family: "evm",
        mode: "send",
        nonce: 0,
        gasLimit: new BigNumber(0),
        chainId: 1,
        gasPrice: new BigNumber(0),
        subAccountId: tokenAccount.id,
        type: 0,
      };
      const amount = await estimateMaxSpendable({
        account: tokenAccount,
        parentAccount: account,
        transaction: legacyTx,
      });

      expect(amount).toEqual(tokenAccount.balance);
    });
  });
});

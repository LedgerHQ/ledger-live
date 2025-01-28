import { Account } from "@ledgerhq/types-live";
import { CosmosTransaction as WalletAPICosmosTransaction } from "@ledgerhq/wallet-api-core";
import BigNumber from "bignumber.js";
import { Transaction } from "@ledgerhq/coin-cosmos/types/index";
import cosmos from "./walletApiAdapter";

describe("getWalletAPITransactionSignFlowInfos", () => {
  describe("should properly get infos for Cosmos platform tx", () => {
    it("without fees provided", () => {
      const cosmosPlatformTx: WalletAPICosmosTransaction = {
        family: "cosmos",
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        mode: "send",
      };

      const expectedLiveTx: Partial<Transaction> = {
        ...cosmosPlatformTx,
        fees: null,
        gas: null,
        useAllAmount: false,
        networkInfo: null,
        memo: null,
        sourceValidator: null,
        validators: [],
      };

      const { canEditFees, hasFeesProvided, liveTx } = cosmos.getWalletAPITransactionSignFlowInfos({
        walletApiTransaction: cosmosPlatformTx,
        account: {} as Account,
      });

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toEqual(expectedLiveTx);
    });

    it("with fees provided", () => {
      const cosmosPlatformTx: WalletAPICosmosTransaction = {
        family: "cosmos",
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        fees: new BigNumber(300),
        mode: "send",
      };

      const expectedLiveTx: Partial<Transaction> = {
        ...cosmosPlatformTx,
        gas: null,
        useAllAmount: false,
        networkInfo: null,
        memo: null,
        sourceValidator: null,
        validators: [],
      };

      const { canEditFees, hasFeesProvided, liveTx } = cosmos.getWalletAPITransactionSignFlowInfos({
        walletApiTransaction: cosmosPlatformTx,
        account: {} as Account,
      });

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(true);

      expect(liveTx).toEqual(expectedLiveTx);
    });
  });
});

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
      };

      const { canEditFees, hasFeesProvided, liveTx } = cosmos.getWalletAPITransactionSignFlowInfos({
        walletApiTransaction: cosmosPlatformTx,
        account: {} as Account,
      });

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(true);

      expect(liveTx).toEqual(expectedLiveTx);
    });

    it("with a memo provided", () => {
      const cosmosPlatformTx: WalletAPICosmosTransaction = {
        family: "cosmos",
        amount: new BigNumber(100000),
        recipient: "0xABCDEF",
        mode: "send",
        memo: "pay invoice 42",
      };

      const { liveTx } = cosmos.getWalletAPITransactionSignFlowInfos({
        walletApiTransaction: cosmosPlatformTx,
        account: {} as Account,
      });

      expect(liveTx.memo).toBe("pay invoice 42");
      expect(liveTx.memoType).toBe("text");
      expect(liveTx.memoValue).toBe("pay invoice 42");
    });

    it("maps the validator of a staking transaction to valAddress", () => {
      const { liveTx } = cosmos.getWalletAPITransactionSignFlowInfos({
        walletApiTransaction: {
          family: "cosmos",
          amount: new BigNumber(100),
          recipient: "",
          mode: "delegate",
          validators: [{ address: "cosmosvaloper1", amount: new BigNumber(100) }],
        },
        account: {} as Account,
      });

      expect(liveTx).toMatchObject({ mode: "delegate", valAddress: "cosmosvaloper1" });
      expect(liveTx).not.toHaveProperty("dstValAddress");
    });

    it("defaults valAddress to an empty string without validators", () => {
      const { liveTx } = cosmos.getWalletAPITransactionSignFlowInfos({
        walletApiTransaction: {
          family: "cosmos",
          amount: new BigNumber(100),
          recipient: "",
          mode: "claimReward",
        },
        account: {} as Account,
      });

      expect(liveTx).toMatchObject({ mode: "claimReward", valAddress: "" });
    });

    it("maps source and destination validators of a redelegation", () => {
      const { liveTx } = cosmos.getWalletAPITransactionSignFlowInfos({
        walletApiTransaction: {
          family: "cosmos",
          amount: new BigNumber(100),
          recipient: "",
          mode: "redelegate",
          sourceValidator: "cosmosvaloper1",
          validators: [{ address: "cosmosvaloper2", amount: new BigNumber(100) }],
        },
        account: {} as Account,
      });

      expect(liveTx).toMatchObject({
        mode: "redelegate",
        valAddress: "cosmosvaloper1",
        dstValAddress: "cosmosvaloper2",
      });
    });

    it("defaults redelegation validators to empty strings", () => {
      const { liveTx } = cosmos.getWalletAPITransactionSignFlowInfos({
        walletApiTransaction: {
          family: "cosmos",
          amount: new BigNumber(100),
          recipient: "",
          mode: "redelegate",
        },
        account: {} as Account,
      });

      expect(liveTx).toMatchObject({ valAddress: "", dstValAddress: "" });
    });
  });
});

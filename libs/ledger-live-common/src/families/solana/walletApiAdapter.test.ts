import { Account, TokenAccount } from "@ledgerhq/types-live";
import { SolanaTransaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";
import BigNumber from "bignumber.js";
import { Transaction } from "@ledgerhq/coin-solana/types";
import sol from "./walletApiAdapter";

describe("getWalletAPITransactionSignFlowInfos", () => {
  describe("should properly get infos for Solana TX", () => {
    it("simple transfer", () => {
      const solanaTx: WalletAPITransaction = {
        family: "solana",
        amount: new BigNumber(100000),
        recipient: "0xABCDEFG",
        model: {
          kind: "transfer",
          uiState: {},
        },
      };

      const expectedLiveTx: Transaction = {
        ...solanaTx,
        model: { ...solanaTx.model, commandDescriptor: undefined },
      };

      const { canEditFees, hasFeesProvided, liveTx } = sol.getWalletAPITransactionSignFlowInfos({
        walletApiTransaction: solanaTx,
        account: {} as Account,
      });

      expect(canEditFees).toBe(false);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toEqual(expectedLiveTx);
    });

    it("should add subAccountId for token transfer", () => {
      const solanaTx: WalletAPITransaction = {
        family: "solana",
        amount: new BigNumber(100000),
        recipient: "0xABCDEFG",
        model: {
          kind: "token.transfer",
          uiState: {
            subAccountId: "", // Automatically replaced by LL
          },
        },
      };

      const expectedLiveTx: Transaction = {
        ...solanaTx,
        model: { ...solanaTx.model, commandDescriptor: undefined },
        subAccountId: "subAccountId",
      };

      const { canEditFees, hasFeesProvided, liveTx } = sol.getWalletAPITransactionSignFlowInfos({
        walletApiTransaction: solanaTx,
        account: { id: "subAccountId", type: "TokenAccount" } as TokenAccount,
      });

      expect(canEditFees).toBe(false);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toEqual(expectedLiveTx);
    });
  });
});

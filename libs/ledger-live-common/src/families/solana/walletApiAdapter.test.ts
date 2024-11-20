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
          commandDescriptor: {
            command: {
              kind: "transfer",
              amount: 100000,
              sender: "0xABCDEF",
              recipient: "0xABCDEFG",
            },
            fee: 0,
            errors: {},
            warnings: {},
          },
        },
      };

      const expectedLiveTx: Partial<Transaction> = {
        ...solanaTx,
      };

      const { canEditFees, hasFeesProvided, liveTx } = sol.getWalletAPITransactionSignFlowInfos({
        walletApiTransaction: solanaTx,
        account: {} as Account,
      });

      expect(canEditFees).toBe(true);

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
          commandDescriptor: {
            command: {
              kind: "token.transfer",
              amount: 100000,
              mintAddress: "0xABCDE",
              mintDecimals: 6,
              ownerAddress: "0xABCDEF",
              ownerAssociatedTokenAccountAddress: "0xABCDEF",
              recipientDescriptor: {
                shouldCreateAsAssociatedTokenAccount: false,
                tokenAccAddress: "0xABCDEFG",
                walletAddress: "0xABCDEFG",
              },
            },
            fee: 0,
            errors: {},
            warnings: {},
          },
        },
      };

      const expectedLiveTx: Partial<Transaction> = {
        ...solanaTx,
        subAccountId: "subAccountId",
      };

      const { canEditFees, hasFeesProvided, liveTx } = sol.getWalletAPITransactionSignFlowInfos({
        walletApiTransaction: solanaTx,
        account: { id: "subAccountId", type: "TokenAccount" } as TokenAccount,
      });

      expect(canEditFees).toBe(true);

      expect(hasFeesProvided).toBe(false);

      expect(liveTx).toEqual(expectedLiveTx);
    });
  });
});

import { decodeTokenAccountIdSync } from "@ledgerhq/ledger-wallet-framework/account/accountId";
import { AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { SolanaTransaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";
import BigNumber from "bignumber.js";
import sol from "./walletApiAdapter";
import { STAKE_ACCOUNT_MEMO_TYPE, TEXT_MEMO_TYPE } from "./transactions";

const signFlowInfos = (solanaTx: WalletAPITransaction, account = {} as AccountLike) =>
  sol.getWalletAPITransactionSignFlowInfos({ walletApiTransaction: solanaTx, account });

describe("getWalletAPITransactionSignFlowInfos", () => {
  describe("should properly get infos for Solana TX", () => {
    it("simple transfer", () => {
      const solanaTx: WalletAPITransaction = {
        family: "solana",
        amount: new BigNumber(100000),
        recipient: "0xABCDEFG",
        model: { kind: "transfer", uiState: {} },
      };

      const { canEditFees, hasFeesProvided, liveTx } = signFlowInfos(solanaTx);

      expect(canEditFees).toBe(false);
      expect(hasFeesProvided).toBe(false);
      expect(liveTx).toEqual({
        family: "solana",
        amount: new BigNumber(100000),
        recipient: "0xABCDEFG",
        mode: "send",
      });
    });

    it("carries the memo of a transfer", () => {
      const { liveTx } = signFlowInfos({
        family: "solana",
        amount: new BigNumber(100000),
        recipient: "0xABCDEFG",
        model: { kind: "transfer", uiState: { memo: "hello" } },
      });

      expect(liveTx).toMatchObject({ memoType: TEXT_MEMO_TYPE, memoValue: "hello" });
    });

    it("should add subAccountId for token transfer", () => {
      const solanaTx: WalletAPITransaction = {
        family: "solana",
        amount: new BigNumber(100000),
        recipient: "0xABCDEFG",
        model: {
          kind: "token.transfer",
          uiState: { subAccountId: "" }, // Automatically replaced by LL
        },
      };

      const { liveTx } = signFlowInfos(solanaTx, {
        id: "subAccountId",
        type: "TokenAccount",
      } as TokenAccount);

      expect(liveTx).toEqual({
        family: "solana",
        amount: new BigNumber(100000),
        recipient: "0xABCDEFG",
        mode: "send",
        subAccountId: "subAccountId",
      });
    });

    it("creates a stake account, delegating to the vote account", () => {
      const { liveTx } = signFlowInfos({
        family: "solana",
        amount: new BigNumber(100000),
        recipient: "",
        model: {
          kind: "stake.createAccount",
          uiState: { delegate: { voteAccAddress: "voteAcc" } },
        },
      });

      expect(liveTx).toMatchObject({
        mode: "stake",
        recipient: "voteAcc",
        amount: new BigNumber(100000),
      });
    });

    it("delegates an existing stake account", () => {
      const { liveTx } = signFlowInfos({
        family: "solana",
        amount: new BigNumber(0),
        recipient: "",
        model: {
          kind: "stake.delegate",
          uiState: { stakeAccAddr: "stakeAcc", voteAccAddr: "voteAcc" },
        },
      });

      expect(liveTx).toMatchObject({
        mode: "delegate",
        recipient: "voteAcc",
        memoType: STAKE_ACCOUNT_MEMO_TYPE,
        memoValue: "stakeAcc",
      });
    });

    it("undelegates a stake account", () => {
      const { liveTx } = signFlowInfos({
        family: "solana",
        amount: new BigNumber(0),
        recipient: "",
        model: { kind: "stake.undelegate", uiState: { stakeAccAddr: "stakeAcc" } },
      });

      expect(liveTx).toMatchObject({ mode: "undelegate", recipient: "stakeAcc" });
    });

    it("withdraws from a stake account", () => {
      const { liveTx } = signFlowInfos({
        family: "solana",
        amount: new BigNumber(100000),
        recipient: "",
        model: { kind: "stake.withdraw", uiState: { stakeAccAddr: "stakeAcc" } },
      });

      expect(liveTx).toMatchObject({
        mode: "unstake",
        recipient: "stakeAcc",
        amount: new BigNumber(100000),
      });
    });

    // Only a live app submits these four; no first-party screen builds them.
    it("opts a token account in, naming the token by a decodable sub-account id", () => {
      const { liveTx } = signFlowInfos(
        {
          family: "solana",
          amount: new BigNumber(0),
          recipient: "",
          model: { kind: "token.createATA", uiState: { tokenId: "solana/spl/usdc" } },
        },
        { type: "Account", id: "js:2:solana:addr:" } as AccountLike,
      );

      expect(liveTx).toMatchObject({ mode: "opt-in" });
      expect(decodeTokenAccountIdSync(liveTx.subAccountId as string)).toEqual({
        accountId: "js:2:solana:addr:",
        tokenId: "solana/spl/usdc",
      });
    });

    it("derives the opt-in sub-account id from the parent of a token account", () => {
      const { liveTx } = signFlowInfos(
        {
          family: "solana",
          amount: new BigNumber(0),
          recipient: "",
          model: { kind: "token.createATA", uiState: { tokenId: "solana/spl/usdc" } },
        },
        { type: "TokenAccount", id: "other+tok", parentId: "js:2:solana:addr:" } as AccountLike,
      );

      expect(decodeTokenAccountIdSync(liveTx.subAccountId as string).accountId).toBe(
        "js:2:solana:addr:",
      );
    });

    it("delegates spending authority, naming the delegate as recipient", () => {
      const { liveTx } = signFlowInfos({
        family: "solana",
        amount: new BigNumber(1000),
        recipient: "delegateAddr",
        model: { kind: "token.approve", uiState: { subAccountId: "subAccountId" } },
      });

      expect(liveTx).toMatchObject({
        mode: "approve",
        subAccountId: "subAccountId",
        recipient: "delegateAddr",
      });
    });

    it("takes that authority back", () => {
      const { liveTx } = signFlowInfos({
        family: "solana",
        amount: new BigNumber(0),
        recipient: "",
        model: { kind: "token.revoke", uiState: { subAccountId: "subAccountId" } },
      });

      expect(liveTx).toMatchObject({ mode: "revoke", subAccountId: "subAccountId" });
    });

    it("splits a stake account, carrying it as the stake-account memo", () => {
      const { liveTx } = signFlowInfos({
        family: "solana",
        amount: new BigNumber(500),
        recipient: "",
        model: { kind: "stake.split", uiState: { stakeAccAddr: "stakeAcc" } },
      });

      expect(liveTx).toMatchObject({
        mode: "split",
        recipient: "stakeAcc",
        memoType: STAKE_ACCOUNT_MEMO_TYPE,
        memoValue: "stakeAcc",
      });
    });
  });
});

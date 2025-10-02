import invariant from "invariant";
import { TokenAssociateTransaction, TransferTransaction } from "@hashgraph/sdk";
import { FeeEstimation, Operation } from "@ledgerhq/coin-framework/api/types";
import { createApi } from "../api";
import { HEDERA_TRANSACTION_MODES, TINYBAR_SCALE } from "../constants";
import { base64ToUrlSafeBase64 } from "../logic/utils";
import { MAINNET_TEST_ACCOUNTS } from "../test/fixtures/account.fixture";
import type { HederaMemo } from "../types";

describe("createApi", () => {
  const api = createApi({});

  describe("craftTransaction", () => {
    it("returns serialized native coin TransferTransaction", async () => {
      const { transaction: hex } = await api.craftTransaction({
        asset: {
          type: "native",
        },
        type: HEDERA_TRANSACTION_MODES.Send,
        amount: BigInt(1 * 10 ** TINYBAR_SCALE),
        sender: MAINNET_TEST_ACCOUNTS.withoutTokens.accountId,
        senderPublicKey: MAINNET_TEST_ACCOUNTS.withoutTokens.publicKey,
        recipient: MAINNET_TEST_ACCOUNTS.withTokens.accountId,
        memo: {
          kind: "text",
          type: "string",
          value: "native transfer",
        },
      });

      const rawTx = TransferTransaction.fromBytes(Buffer.from(hex, "hex"));

      expect(rawTx).toBeInstanceOf(TransferTransaction);
      invariant(rawTx instanceof TransferTransaction, "TransferTransaction type guard");

      const sendTransfer = rawTx.hbarTransfers.get(MAINNET_TEST_ACCOUNTS.withoutTokens.accountId);
      const receiveTransfer = rawTx.hbarTransfers.get(MAINNET_TEST_ACCOUNTS.withTokens.accountId);
      const sendAmount = sendTransfer?.toBigNumber().toString();
      const receiveAmount = receiveTransfer?.toBigNumber().toString();

      expect(rawTx.hbarTransfers);
      expect(sendAmount).toBe("-1");
      expect(receiveAmount).toBe("1");
      expect(rawTx.transactionMemo).toBe("native transfer");
    });

    it("returns serialized HTS token TransferTransaction", async () => {
      const { transaction: hex } = await api.craftTransaction({
        asset: {
          type: "hts",
          assetReference: "0.0.5022567",
        },
        type: HEDERA_TRANSACTION_MODES.Send,
        amount: BigInt(1),
        sender: MAINNET_TEST_ACCOUNTS.withoutTokens.accountId,
        senderPublicKey: MAINNET_TEST_ACCOUNTS.withoutTokens.publicKey,
        recipient: MAINNET_TEST_ACCOUNTS.withTokens.accountId,
        memo: {
          kind: "text",
          type: "string",
          value: "token transfer",
        },
      });

      const rawTx = TransferTransaction.fromBytes(Buffer.from(hex, "hex"));

      expect(rawTx).toBeInstanceOf(TransferTransaction);
      invariant(rawTx instanceof TransferTransaction, "TransferTransaction type guard");

      const tokenTransfers = rawTx.tokenTransfers.get("0.0.5022567");
      const senderTransfer = tokenTransfers?.get(MAINNET_TEST_ACCOUNTS.withoutTokens.accountId);
      const recipientTransfer = tokenTransfers?.get(MAINNET_TEST_ACCOUNTS.withTokens.accountId);

      expect(tokenTransfers).not.toBeNull();
      expect(senderTransfer?.toString()).toBe("-1");
      expect(recipientTransfer?.toString()).toBe("1");
      expect(rawTx.transactionMemo).toBe("token transfer");
    });

    it("returns serialized HTS token association transaction", async () => {
      const { transaction: hex } = await api.craftTransaction({
        asset: {
          type: "hts",
          assetReference: "0.0.5022567",
        },
        amount: BigInt(0),
        sender: MAINNET_TEST_ACCOUNTS.withoutTokens.accountId,
        senderPublicKey: MAINNET_TEST_ACCOUNTS.withoutTokens.publicKey,
        recipient: MAINNET_TEST_ACCOUNTS.withoutTokens.accountId,
        type: HEDERA_TRANSACTION_MODES.TokenAssociate,
        memo: {
          kind: "text",
          type: "string",
          value: "token association",
        },
      });

      const rawTx = TokenAssociateTransaction.fromBytes(Buffer.from(hex, "hex"));

      expect(rawTx).toBeInstanceOf(TokenAssociateTransaction);
      invariant(rawTx instanceof TokenAssociateTransaction, "TokenAssociateTransaction type guard");
      expect(rawTx.accountId?.toString()).toBe(MAINNET_TEST_ACCOUNTS.withoutTokens.accountId);
      expect(rawTx.tokenIds?.length).toBe(1);
      expect(rawTx.tokenIds?.[0].toString()).toBe("0.0.5022567");
      expect(rawTx.transactionMemo).toBe("token association");
    });

    it("applies customFees properly", async () => {
      const customFees: FeeEstimation = {
        value: BigInt(1000),
      };

      const { transaction: hex } = await api.craftTransaction(
        {
          asset: {
            type: "native",
          },
          amount: BigInt(1 * 10 ** TINYBAR_SCALE),
          sender: MAINNET_TEST_ACCOUNTS.withoutTokens.accountId,
          senderPublicKey: MAINNET_TEST_ACCOUNTS.withoutTokens.publicKey,
          recipient: MAINNET_TEST_ACCOUNTS.withTokens.accountId,
          type: HEDERA_TRANSACTION_MODES.Send,
          memo: {
            kind: "text",
            type: "string",
            value: "",
          },
        },
        customFees,
      );

      const rawTx = TransferTransaction.fromBytes(Buffer.from(hex, "hex"));

      expect(rawTx).toBeInstanceOf(TransferTransaction);
      invariant(rawTx instanceof TransferTransaction, "TransferTransaction type guard");

      expect(rawTx.maxTransactionFee?.toTinybars().toString()).toBe(customFees.value.toString());
    });
  });

  describe("estimateFees", () => {
    it("returns fee for coin transfer transaction", async () => {
      const fees = await api.estimateFees({
        asset: {
          type: "native",
        },
        type: HEDERA_TRANSACTION_MODES.Send,
        sender: MAINNET_TEST_ACCOUNTS.withoutTokens.accountId,
        senderPublicKey: MAINNET_TEST_ACCOUNTS.withoutTokens.publicKey,
        amount: BigInt(100),
        recipient: MAINNET_TEST_ACCOUNTS.withTokens.accountId,
        memo: {
          kind: "text",
          type: "string",
          value: "",
        },
      });

      expect(fees.value).toBeGreaterThanOrEqual(0n);
    });

    it("returns fee for token transfer transaction", async () => {
      const fees = await api.estimateFees({
        asset: {
          type: "hts",
          assetReference: "0.0.5022567",
        },
        type: HEDERA_TRANSACTION_MODES.Send,
        sender: MAINNET_TEST_ACCOUNTS.withoutTokens.accountId,
        senderPublicKey: MAINNET_TEST_ACCOUNTS.withoutTokens.publicKey,
        amount: BigInt(100),
        recipient: MAINNET_TEST_ACCOUNTS.withTokens.accountId,
        memo: {
          kind: "text",
          type: "string",
          value: "",
        },
      });

      expect(fees.value).toBeGreaterThanOrEqual(0n);
    });

    it("returns fee for token association transaction", async () => {
      const fees = await api.estimateFees({
        asset: {
          type: "hts",
          assetReference: "0.0.5022567",
        },
        type: HEDERA_TRANSACTION_MODES.TokenAssociate,
        sender: MAINNET_TEST_ACCOUNTS.withoutTokens.accountId,
        senderPublicKey: MAINNET_TEST_ACCOUNTS.withoutTokens.publicKey,
        amount: BigInt(100),
        recipient: MAINNET_TEST_ACCOUNTS.withTokens.accountId,
        memo: {
          kind: "text",
          type: "string",
          value: "",
        },
      });

      expect(fees.value).toBeGreaterThanOrEqual(0n);
    });
  });

  describe("getBalance", () => {
    it("returns zero balance for pristine account", async () => {
      const balances = await api.getBalance(MAINNET_TEST_ACCOUNTS.pristine.accountId);

      expect(balances[0].value).toBe(0n);
    });

    it("returns native asset for account without tokens", async () => {
      const balances = await api.getBalance(MAINNET_TEST_ACCOUNTS.withoutTokens.accountId);
      const nativeBalance = balances.filter(b => b.asset.type === "native");

      expect(nativeBalance.length).toBe(1);
      expect(nativeBalance[0].value).toBeGreaterThan(0n);
    });

    it("returns native and token assets for account with tokens", async () => {
      const balances = await api.getBalance(MAINNET_TEST_ACCOUNTS.withTokens.accountId);
      const tokenBalances = balances.filter(b => b.asset.type !== "native");

      const associatedTokenWithBalance = balances.find(b => {
        return (
          "assetReference" in b.asset &&
          b.asset.assetReference === MAINNET_TEST_ACCOUNTS.withTokens.associatedTokenWithBalance
        );
      });

      const associatedTokenWithoutBalance = balances.find(b => {
        return (
          "assetReference" in b.asset &&
          b.asset.assetReference === MAINNET_TEST_ACCOUNTS.withTokens.associatedTokenWithoutBalance
        );
      });

      const notAssociatedToken = balances.find(b => {
        return (
          "assetReference" in b.asset &&
          b.asset.assetReference === MAINNET_TEST_ACCOUNTS.withTokens.notAssociatedToken
        );
      });

      expect(tokenBalances.length).toBeGreaterThan(0);
      expect(associatedTokenWithBalance?.value).toBeGreaterThan(0n);
      expect(associatedTokenWithoutBalance?.value).toBe(0n);
      expect(notAssociatedToken?.value).toBe(undefined);
    });
  });

  describe("lastBlock", () => {
    it("returns the last block information", async () => {
      const lastBlock = await api.lastBlock();

      expect(lastBlock).toMatchObject({
        height: expect.any(Number),
      });
    });
  });

  describe("listOperations", () => {
    it("returns empty array for pristine account", async () => {
      const block = await api.lastBlock();
      const [operations] = await api.listOperations(MAINNET_TEST_ACCOUNTS.pristine.accountId, {
        minHeight: block.height,
        order: "desc",
      });

      expect(operations).toBeInstanceOf(Array);
      expect(operations.length).toBe(0);
    });

    it("returns operations for real account with tokens", async () => {
      const block = await api.lastBlock();
      const [operations] = await api.listOperations(MAINNET_TEST_ACCOUNTS.withTokens.accountId, {
        minHeight: block.height,
        order: "desc",
      });

      const ops = operations as unknown as Operation<HederaMemo>[];
      const memoTxHash = "foj/AjHdDiKpQyOjzqhmKlWsKenGm9UKdy6K4BHcv3OhfSWEollyYsHv4MWKsjQE";
      const operationWithMemo = ops.find(op => op.tx.hash === base64ToUrlSafeBase64(memoTxHash));
      const firstTokenAssociateOperations = ops.find(op => op.type === "ASSOCIATE_TOKEN");
      const firstSendTokenOperation = ops.find(o => o.type === "OUT" && o.asset.type !== "native");

      const hasReceiveHbarOperations = ops.some(o => o.type === "IN" && o.asset.type === "native");
      const hasSendHbarOperations = ops.some(op => op.type === "OUT" && op.asset.type === "native");
      const hasReceiveTokenOperations = ops.some(o => o.type === "IN" && o.asset.type !== "native");
      const hasSendTokenOperations = !!firstSendTokenOperation;
      const hasTokenAssociateOperations = !!firstTokenAssociateOperations;
      const hasCorrectFeesOperation = ops.some(
        o =>
          o.type === "FEES" &&
          o.asset.type === "native" &&
          o.tx.hash === firstSendTokenOperation?.tx.hash,
      );

      expect(ops).toBeInstanceOf(Array);
      expect(ops.length).toBeGreaterThanOrEqual(2);
      expect(hasReceiveHbarOperations).toBe(true);
      expect(hasSendHbarOperations).toBe(true);
      expect(hasReceiveTokenOperations).toBe(true);
      expect(hasSendTokenOperations).toBe(true);
      expect(hasTokenAssociateOperations).toBe(true);
      expect(hasCorrectFeesOperation).toBe(true);
      expect(operationWithMemo?.details).toMatchObject({
        pagingToken: expect.any(String),
        consensusTimestamp: expect.any(String),
        ledgerOpType: expect.any(String),
        memo: expect.any(String),
      });
      expect(firstTokenAssociateOperations?.details).toMatchObject({
        pagingToken: expect.any(String),
        consensusTimestamp: expect.any(String),
        ledgerOpType: expect.any(String),
        associatedTokenId: expect.any(String),
      });
    });
  });
});

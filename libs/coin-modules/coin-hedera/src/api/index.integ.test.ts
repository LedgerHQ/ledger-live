import invariant from "invariant";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import {
  AccountId,
  Hbar,
  HbarUnit,
  Long,
  TokenAssociateTransaction,
  TransferTransaction,
  AccountUpdateTransaction,
} from "@hashgraph/sdk";
import type { FeeEstimation } from "@ledgerhq/coin-framework/api/types";
import { createApi } from "../api";
import { HEDERA_TRANSACTION_MODES, TINYBAR_SCALE } from "../constants";
import { getSyntheticBlock } from "../logic/utils";
import { rpcClient } from "../network/rpc";
import { MAINNET_TEST_ACCOUNTS } from "../test/fixtures/account.fixture";

describe("createApi", () => {
  const api = createApi({});

  beforeAll(() => {
    // Setup CAL client store (automatically set as global store)
    setupCalClientStore();
  });

  afterAll(async () => {
    await rpcClient._resetInstance();
  });

  describe("craftTransaction", () => {
    it("returns serialized native coin TransferTransaction", async () => {
      const { transaction: hex } = await api.craftTransaction({
        intentType: "transaction",
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

      expect(rawTx.hbarTransfers.size).toBe(2);
      expect(sendTransfer).toEqual(Hbar.from(-1, HbarUnit.Hbar));
      expect(receiveTransfer).toEqual(Hbar.from(1, HbarUnit.Hbar));
      expect(rawTx.transactionMemo).toBe("native transfer");
    });

    it("returns serialized HTS token TransferTransaction", async () => {
      const { transaction: hex } = await api.craftTransaction({
        intentType: "transaction",
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

      expect(senderTransfer).toEqual(Long.fromNumber(-1));
      expect(recipientTransfer).toEqual(Long.fromNumber(1));
      expect(tokenTransfers).not.toBeNull();
      expect(rawTx.transactionMemo).toBe("token transfer");
    });

    it("returns serialized HTS token association transaction", async () => {
      const { transaction: hex } = await api.craftTransaction({
        intentType: "transaction",
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
      expect(rawTx.accountId).toEqual(
        AccountId.fromString(MAINNET_TEST_ACCOUNTS.withoutTokens.accountId),
      );
      // .toString() is used because sdk.TokenId.fromString() sets `_checksum` to undefined,
      // where tokenIds elements from TokenAssociateTransaction.fromBytes have it set to null
      expect(rawTx.tokenIds?.[0]?.toString()).toEqual("0.0.5022567");
      expect(rawTx.transactionMemo).toBe("token association");
    });

    it.each([HEDERA_TRANSACTION_MODES.Delegate, HEDERA_TRANSACTION_MODES.Undelegate])(
      "returns serialized %s transaction",
      async type => {
        const { transaction: hex } = await api.craftTransaction({
          intentType: "transaction",
          asset: {
            type: "native",
          },
          type,
          amount: BigInt(0),
          sender: MAINNET_TEST_ACCOUNTS.withoutTokens.accountId,
          senderPublicKey: MAINNET_TEST_ACCOUNTS.withoutTokens.publicKey,
          recipient: MAINNET_TEST_ACCOUNTS.withoutTokens.accountId,
          memo: {
            kind: "text",
            type: "string",
            value: type,
          },
        });

        const rawTx = AccountUpdateTransaction.fromBytes(Buffer.from(hex, "hex"));

        expect(rawTx).toBeInstanceOf(AccountUpdateTransaction);
        invariant(rawTx instanceof AccountUpdateTransaction, "AccountUpdateTransaction type guard");
        expect(rawTx.accountId).toEqual(
          AccountId.fromString(MAINNET_TEST_ACCOUNTS.withoutTokens.accountId),
        );
        expect(rawTx.transactionMemo).toBe(type);
      },
    );

    it("applies customFees properly", async () => {
      const customFees: FeeEstimation = {
        value: BigInt(1000),
      };

      const { transaction: hex } = await api.craftTransaction(
        {
          intentType: "transaction",
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
      const expectedMaxFee = Hbar.from(customFees.value.toString(), HbarUnit.Tinybar);

      expect(rawTx).toBeInstanceOf(TransferTransaction);
      invariant(rawTx instanceof TransferTransaction, "TransferTransaction type guard");
      expect(rawTx.maxTransactionFee).toEqual(expectedMaxFee);
    });
  });

  describe("estimateFees", () => {
    it("returns fee for coin transfer transaction", async () => {
      const fees = await api.estimateFees({
        intentType: "transaction",
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
        intentType: "transaction",
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
        intentType: "transaction",
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

    it.each([
      HEDERA_TRANSACTION_MODES.Delegate,
      HEDERA_TRANSACTION_MODES.Undelegate,
      HEDERA_TRANSACTION_MODES.ClaimRewards,
      HEDERA_TRANSACTION_MODES.Redelegate,
    ])("returns fee for %s transaction", async type => {
      const fees = await api.estimateFees({
        intentType: "transaction",
        asset: {
          type: "native",
        },
        type,
        sender: MAINNET_TEST_ACCOUNTS.withoutTokens.accountId,
        senderPublicKey: MAINNET_TEST_ACCOUNTS.withoutTokens.publicKey,
        amount: BigInt(100),
        recipient: MAINNET_TEST_ACCOUNTS.withTokens.accountId,
        memo: {
          kind: "text",
          type: "string",
          value: type,
        },
      });

      expect(fees.value).toBeGreaterThanOrEqual(0n);
    });
  });

  describe("getBalance", () => {
    it("returns zero balance for pristine account", async () => {
      const balances = await api.getBalance(MAINNET_TEST_ACCOUNTS.pristine.accountId);

      expect(balances.length).toBe(1);
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

    it("returns stake information for delegated account", async () => {
      const balances = await api.getBalance(MAINNET_TEST_ACCOUNTS.activeStaking.accountId);
      const nativeBalance = balances.find(b => b.asset.type === "native");

      expect(nativeBalance?.stake).toMatchObject({
        uid: MAINNET_TEST_ACCOUNTS.activeStaking.accountId,
        address: MAINNET_TEST_ACCOUNTS.activeStaking.accountId,
        asset: { type: "native" },
        state: "active",
        amount: expect.any(BigInt),
        amountDeposited: expect.any(BigInt),
        amountRewarded: expect.any(BigInt),
        delegate: expect.any(String),
      });
    });

    it("returns no stake information for non-delegated account", async () => {
      const balances = await api.getBalance(MAINNET_TEST_ACCOUNTS.inactiveStaking.accountId);
      const nativeBalance = balances.find(b => b.asset.type === "native");

      expect(nativeBalance?.stake).toBe(undefined);
    });
  });

  describe("getBlock", () => {
    it("returns block with proper multi-transfer data", async () => {
      const blockHeight = 176051087;
      const multiTransferTxHash =
        "OoaJ/10qHN/97Zaxj8vxGIJfL9UhrGKaJBwclsL4wUeqbegBAXhdmw+/6/dB6mow";

      const expectedCoinTransferTx = {
        hash: multiTransferTxHash,
        failed: false,
        fees: 1176695n,
        feesPayer: "0.0.8835924",
        operations: [
          {
            type: "transfer",
            address: "0.0.15",
            asset: {
              type: "native",
            },
            amount: 55631n,
          },
          {
            type: "transfer",
            address: "0.0.801",
            asset: {
              type: "native",
            },
            amount: 1121064n,
          },
          {
            type: "transfer",
            address: "0.0.8835924",
            asset: {
              type: "native",
            },
            amount: -2000000n, // -3176695n + 1176695n fee
          },
          {
            type: "transfer",
            address: "0.0.9124531",
            asset: {
              type: "native",
            },
            amount: 1000000n,
          },
          {
            type: "transfer",
            address: "0.0.9169746",
            asset: {
              type: "native",
            },
            amount: 1000000n,
          },
          {
            type: "transfer",
            address: "0.0.8835924",
            asset: {
              type: "hts",
              assetReference: "0.0.456858",
            },
            amount: -10000n,
          },
          {
            type: "transfer",
            address: "0.0.9124531",
            asset: {
              type: "hts",
              assetReference: "0.0.456858",
            },
            amount: 10000n,
          },
          {
            type: "transfer",
            address: "0.0.8835924",
            asset: {
              type: "hts",
              assetReference: "0.0.5022567",
            },
            amount: -2n,
          },
          {
            type: "transfer",
            address: "0.0.9124531",
            asset: {
              type: "hts",
              assetReference: "0.0.5022567",
            },
            amount: 1n,
          },
          {
            type: "transfer",
            address: "0.0.9169746",
            asset: {
              type: "hts",
              assetReference: "0.0.5022567",
            },
            amount: 1n,
          },
        ],
      };

      const block = await api.getBlock(blockHeight);
      const resultCoinTransferTx = block.transactions.find(tx => tx.hash === multiTransferTxHash);

      expect(block.info.height).toBe(blockHeight);
      expect(block.info.hash?.length).toBe(64);
      expect(block.info.time).toBeInstanceOf(Date);
      expect(block.info.time?.getTime()).toBeGreaterThan(0);
      expect(resultCoinTransferTx).toMatchObject(expectedCoinTransferTx);
      expect(block.transactions).toBeInstanceOf(Array);
      expect(block.transactions.length).toEqual(48);
      block.transactions.forEach(tx => {
        expect(tx.hash.length).toBe(64);
        expect(tx.fees).toBeGreaterThanOrEqual(0n);
      });
    });

    it("returns block with transaction memo", async () => {
      const blockHeight = 176180671;
      const txHash = "4Ksb7RTwtvvk9r6vvK0Gwxb38kwPqVbJjP6bL4bu2gTvdwrIGZGk6TWntlgRsjvU";

      const block = await api.getBlock(blockHeight);
      const transaction = block.transactions.find(tx => tx.hash === txHash);

      expect(transaction?.details?.memo).toBe("test");
    });

    it("correctly identifies staking operations in blocks", async () => {
      const [delegateBlock, undelegateBlock, redelegateBlock, rewardsBlock] = await Promise.all([
        api.getBlock(176220207),
        api.getBlock(176220201),
        api.getBlock(176220211),
        api.getBlock(176397349),
      ]);

      const delegateOperations = delegateBlock.transactions
        .flatMap(tx => tx.operations)
        .filter(op => op.type === "other");
      const undelegateOperations = undelegateBlock.transactions
        .flatMap(tx => tx.operations)
        .filter(op => op.type === "other");
      const redelegateOperations = redelegateBlock.transactions
        .flatMap(tx => tx.operations)
        .filter(op => op.type === "other");
      const rewardsTransaction = rewardsBlock.transactions.find(
        tx => tx.hash === "Axie2CIoLVxhU6gcHEDJEdNbQ0BW1AqYXqUu97ume44JGvdfSTvF9go2Svc/lms8",
      );

      expect(delegateOperations).toEqual([
        {
          type: "other",
          operationType: "DELEGATE",
          stakedNodeId: 34,
          previousStakedNodeId: null,
          stakedAmount: BigInt(21083322293),
        },
      ]);
      expect(undelegateOperations).toEqual([
        {
          type: "other",
          operationType: "UNDELEGATE",
          stakedNodeId: null,
          previousStakedNodeId: 22,
          stakedAmount: BigInt(21083441623),
        },
      ]);
      expect(redelegateOperations).toEqual([
        {
          type: "other",
          operationType: "REDELEGATE",
          stakedNodeId: 6,
          previousStakedNodeId: 34,
          stakedAmount: BigInt(21083202902),
        },
      ]);
      expect(rewardsTransaction?.operations).toEqual([
        {
          type: "transfer",
          address: "0.0.800",
          amount: BigInt(-6013422),
          asset: {
            type: "native",
          },
        },
        {
          type: "transfer",
          address: "0.0.801",
          amount: BigInt(1968210),
          asset: {
            type: "native",
          },
        },
        {
          type: "transfer",
          address: "0.0.8835924",
          amount: BigInt(4045212 + 1968210),
          asset: {
            type: "native",
          },
        },
        {
          type: "transfer",
          address: "0.0.8835924",
          amount: BigInt(6013422),
          asset: {
            type: "native",
          },
        },
      ]);
    });

    it("returns block for latest finalized height from lastBlock", async () => {
      const latestBlockInfo = await api.lastBlock();
      const block = await api.getBlock(latestBlockInfo.height);

      expect(block.info.height).toBe(latestBlockInfo.height);
      expect(block.info.hash).toBe(latestBlockInfo.hash);
      // Note: lastBlock().time is the transaction timestamp, while getBlock().info.time is the block start time
      expect(block.info.time).toBeInstanceOf(Date);
      expect(block.transactions).toBeInstanceOf(Array);
    });
  });

  describe("lastBlock", () => {
    it("returns the last block information", async () => {
      const lastBlock = await api.lastBlock();

      expect(lastBlock.height).toBeGreaterThan(0);
      expect(lastBlock.hash?.length).toBe(64);
      expect(lastBlock.time?.getTime()).toBeGreaterThan(0);
    });
  });

  describe("listOperations", () => {
    it("returns empty array for pristine account", async () => {
      const block = await api.lastBlock();
      const { items: operations } = await api.listOperations(
        MAINNET_TEST_ACCOUNTS.pristine.accountId,
        { minHeight: block.height, order: "desc" },
      );

      expect(operations).toBeInstanceOf(Array);
      expect(operations.length).toBe(0);
    });

    it("returns operations with valid synthetic block info", async () => {
      const cursor = "1753099264.927988000";
      const block = await api.lastBlock();
      const { items: ops } = await api.listOperations(MAINNET_TEST_ACCOUNTS.withTokens.accountId, {
        minHeight: block.height,
        cursor,
        limit: 4,
        order: "asc",
      });

      const expectedSyntheticBlock = getSyntheticBlock(cursor);
      const blockHeights = ops.map(o => o.tx.block.height);

      expect(blockHeights).toHaveLength(6);
      expect(blockHeights.every(h => h >= expectedSyntheticBlock.blockHeight)).toBe(true);
    });

    it("returns operations for real account with tokens", async () => {
      const cursor = "1753099264.927988000";
      const block = await api.lastBlock();
      const { items: ops } = await api.listOperations(MAINNET_TEST_ACCOUNTS.withTokens.accountId, {
        minHeight: block.height,
        cursor,
        limit: 100,
        order: "desc",
      });

      const memoTxHash = "WvMcFERtxRsGJqxqGVDYa6JR5PqLgFeJxiSVoimayaWra/AMEJMzC09LhdRLTZ/M";
      const operationWithMemo = ops.find(op => op.tx.hash === memoTxHash);
      const firstTokenAssociateOperations = ops.find(op => op.type === "ASSOCIATE_TOKEN");
      const firstSendTokenOperation = ops.find(o => o.type === "OUT" && o.asset.type !== "native");

      const hasReceiveHbarOperations = ops.some(o => o.type === "IN" && o.asset.type === "native");
      const hasSendHbarOperations = ops.some(op => op.type === "OUT" && op.asset.type === "native");
      const hasReceiveTokenOperations = ops.some(o => o.type === "IN" && o.asset.type !== "native");
      const hasSendTokenOperations = !!firstSendTokenOperation;
      const hasTokenAssociateOperations = !!firstTokenAssociateOperations;
      const hasFeesOperationForSendToken = ops.some(
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
      expect(hasFeesOperationForSendToken).toBe(false);
      expect(hasTokenAssociateOperations).toBe(true);
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
      // every transfer operation should have a fees payer
      expect(ops.every(op => /^0\.0\.\d+$/.test(op.tx.feesPayer ?? ""))).toBe(true);
    });

    it("returns staking operations with correct metadata", async () => {
      const cursor = "1762202113.000000000";
      const block = await api.lastBlock();
      const { items: ops } = await api.listOperations(
        MAINNET_TEST_ACCOUNTS.activeStaking.accountId,
        { minHeight: block.height, cursor, limit: 30, order: "desc" },
      );

      const rewardOp = ops.find(op => op.type === "REWARD");
      const delegateOp = ops.find(op => op.type === "DELEGATE");
      const undelegateOp = ops.find(op => op.type === "UNDELEGATE");
      const redelegateOp = ops.find(op => op.type === "REDELEGATE");

      expect(delegateOp?.value).toBe(BigInt(0));
      expect(delegateOp?.tx.fees).toBeGreaterThan(BigInt(0));
      expect(delegateOp?.details).toMatchObject({
        previousStakingNodeId: null,
        targetStakingNodeId: expect.any(Number),
        stakedAmount: expect.any(BigInt),
      });
      expect(undelegateOp?.value).toBe(BigInt(0));
      expect(undelegateOp?.tx.fees).toBeGreaterThan(BigInt(0));
      expect(undelegateOp?.details).toMatchObject({
        previousStakingNodeId: expect.any(Number),
        targetStakingNodeId: null,
        stakedAmount: expect.any(BigInt),
      });
      expect(redelegateOp?.value).toBe(BigInt(0));
      expect(redelegateOp?.tx.fees).toBeGreaterThan(BigInt(0));
      expect(redelegateOp?.details).toMatchObject({
        previousStakingNodeId: expect.any(Number),
        targetStakingNodeId: expect.any(Number),
        stakedAmount: expect.any(BigInt),
      });
      expect(rewardOp?.value).toBeGreaterThan(BigInt(0));
      expect(rewardOp?.tx.fees).toBe(BigInt(0));
      // every staking operation should have a fees payer
      expect(ops.every(op => /^0\.0\.\d+$/.test(op.tx.feesPayer ?? ""))).toBe(true);
    });

    it("returns valid stakedAmount, respecting uncommitted balance changes", async () => {
      const block = await api.lastBlock();
      const { items: ops } = await api.listOperations(
        MAINNET_TEST_ACCOUNTS.withQuickBalanceChanges.accountId,
        { minHeight: block.height, limit: 10, order: "asc" },
      );

      const opDelegate1 = ops[2];
      const opOut1 = ops[3];
      const opUndelegate = ops[4];
      const opOut2 = ops[5];
      const opDelegate2 = ops[6];

      // starting point has known, hardcoded balance
      const expectedBalanceDelegate1 = BigInt(999834971);

      // after undelegate1 we expect stakedAmount to be initial balance reduced by:
      // 1. first DELEGATE fee
      // 2. first OUT value + fee
      const expectedBalanceUndelegate =
        expectedBalanceDelegate1 - opDelegate1.tx.fees - opOut1.value - opOut1.tx.fees;

      // after delegate2 we expect stakedAmount to be undelegate1 balance reduced by:
      // 1. first UNDELEGATE fee
      // 2. second OUT value + fee
      const expectedBalanceDelegate2 =
        expectedBalanceUndelegate - opUndelegate.tx.fees - opOut2.value - opOut2.tx.fees;

      expect(opOut1.type).toBe("OUT");
      expect(opOut2.type).toBe("OUT");
      expect(opDelegate1.type).toBe("DELEGATE");
      expect(opDelegate1.details?.stakedAmount).toBe(expectedBalanceDelegate1);
      expect(opUndelegate.type).toBe("UNDELEGATE");
      expect(opUndelegate.details?.stakedAmount).toBe(expectedBalanceUndelegate);
      expect(opDelegate2.type).toBe("DELEGATE");
      expect(opDelegate2.details?.stakedAmount).toBe(expectedBalanceDelegate2);
    });

    it.each(["desc", "asc"] as const)(
      "returns paginated operations for account with high activity (%s)",
      async order => {
        const minHeight = 0;
        const limit = 10;
        const initialCursor = order === "desc" ? "1762168437.643463899" : undefined;

        const { items: page1, next: pagingToken1 } = await api.listOperations(
          MAINNET_TEST_ACCOUNTS.withTokens.accountId,
          { minHeight, cursor: initialCursor, limit, order },
        );

        const { items: page2, next: pagingToken2 } = await api.listOperations(
          MAINNET_TEST_ACCOUNTS.withTokens.accountId,
          { minHeight, cursor: pagingToken1, limit, order },
        );

        const firstPage1Timestamp = page1[0]?.tx?.date;
        const firstPage2Timestamp = page2[0]?.tx?.date;
        const lastPage1Timestamp = page1[page1.length - 1]?.tx?.date;
        const lastPage2Timestamp = page2[page2.length - 1]?.tx?.date;
        const page1Hashes = new Set(page1.map(op => op.tx.hash));
        const page2Hashes = new Set(page2.map(op => op.tx.hash));
        const hasOverlap = [...page2Hashes].some(hash => page1Hashes.has(hash));

        // NOTE: this won't be equal to limit, because single Hedera transaction can generate multiple operations
        expect(page1.length).toBeGreaterThanOrEqual(limit);
        expect(page2.length).toBeGreaterThanOrEqual(limit);
        expect(pagingToken1).not.toBeNull();
        expect(pagingToken2).not.toBeNull();
        expect(hasOverlap).toBe(false);
        expect(firstPage1Timestamp).toBeInstanceOf(Date);
        expect(firstPage2Timestamp).toBeInstanceOf(Date);
        expect(lastPage1Timestamp).toBeInstanceOf(Date);
        expect(lastPage2Timestamp).toBeInstanceOf(Date);
        expect(lastPage1Timestamp > firstPage2Timestamp).toBe(order === "desc");
        expect(firstPage1Timestamp < lastPage2Timestamp).toBe(order === "asc");
      },
    );
  });

  describe("getValidators", () => {
    it("returns validators with APY information", async () => {
      const result = await api.getValidators();

      expect(result.items.length).toBeGreaterThan(0);
      result.items.forEach(item => {
        expect(item).toMatchObject({
          address: expect.any(String),
          nodeId: expect.any(String),
          name: expect.any(String),
          description: expect.any(String),
          balance: expect.any(BigInt),
          apy: expect.any(Number),
        });
        expect(item.apy).toBeGreaterThanOrEqual(0);
        expect(item.apy).toBeLessThanOrEqual(1);
      });
    });
  });

  describe("getStakes", () => {
    it("returns empty stakes for pristine account", async () => {
      const stakes = await api.getStakes(MAINNET_TEST_ACCOUNTS.pristine.accountId);

      expect(stakes.items.length).toBe(0);
    });

    it("returns stake for delegated account", async () => {
      const stakes = await api.getStakes(MAINNET_TEST_ACCOUNTS.activeStaking.accountId);

      expect(stakes.items.length).toBeGreaterThan(0);
    });
  });

  describe("getRewards", () => {
    it("returns empty rewards for pristine account", async () => {
      const rewards = await api.getRewards(MAINNET_TEST_ACCOUNTS.pristine.accountId);

      expect(rewards.items.length).toBe(0);
    });

    it("returns rewards for delegated account", async () => {
      const rewards = await api.getRewards(MAINNET_TEST_ACCOUNTS.activeStaking.accountId);

      expect(rewards.items.length).toBeGreaterThan(0);
    });
  });
});

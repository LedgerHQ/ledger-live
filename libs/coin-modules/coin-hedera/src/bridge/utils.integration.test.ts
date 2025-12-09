import BigNumber from "bignumber.js";
import { encodeTokenAccountId } from "@ledgerhq/coin-framework/account";
import { setupCalClientStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { HEDERA_OPERATION_TYPES, HEDERA_TRANSACTION_MODES } from "../constants";
import { estimateFees } from "../logic/estimateFees";
import { apiClient } from "../network/api";
import { getERC20Operations } from "../network/utils";
import { getMockedAccount, getMockedTokenAccount } from "../test/fixtures/account.fixture";
import {
  getMockedHTSTokenCurrency,
  getTokenCurrencyFromCAL,
  getTokenCurrencyFromCALByType,
} from "../test/fixtures/currency.fixture";
import { getMockedMirrorToken } from "../test/fixtures/mirror.fixture";
import { getMockedOperation } from "../test/fixtures/operation.fixture";
import { getMockedThirdwebTransaction } from "../test/fixtures/thirdweb.fixture";
import { getMockedTransaction } from "../test/fixtures/transaction.fixture";
import type { EstimateFeesResult } from "../types";
import { calculateAmount, getSubAccounts, integrateERC20Operations } from "./utils";

describe("utils", () => {
  beforeAll(() => {
    // Setup CAL client store (automatically set as global store)
    setupCalClientStore();
  });

  describe("calculateAmount", () => {
    let estimatedFees: Record<"crypto" | "associate", EstimateFeesResult>;

    beforeAll(async () => {
      const mockedAccount = getMockedAccount();
      const [crypto, associate] = await Promise.all([
        estimateFees({
          currency: mockedAccount.currency,
          operationType: HEDERA_OPERATION_TYPES.CryptoTransfer,
        }),
        estimateFees({
          currency: mockedAccount.currency,
          operationType: HEDERA_OPERATION_TYPES.TokenAssociate,
        }),
      ]);

      estimatedFees = { crypto, associate };
    });

    it("HBAR transfer, useAllAmount = true", async () => {
      const mockedAccount = getMockedAccount();
      const mockedTransaction = getMockedTransaction({ useAllAmount: true });

      const amount = mockedAccount.balance.minus(estimatedFees.crypto.tinybars);
      const totalSpent = amount.plus(estimatedFees.crypto.tinybars);

      const result = await calculateAmount({
        account: mockedAccount,
        transaction: mockedTransaction,
      });

      expect(result).toEqual({ amount, totalSpent });
    });

    it("HBAR transfer, useAllAmount = false", async () => {
      const mockedAccount = getMockedAccount();
      const mockedTransaction = getMockedTransaction({
        useAllAmount: false,
        amount: new BigNumber(1000000),
      });

      const amount = mockedTransaction.amount;
      const totalSpent = amount.plus(estimatedFees.crypto.tinybars);

      const result = await calculateAmount({
        account: mockedAccount,
        transaction: mockedTransaction,
      });

      expect(result).toEqual({ amount, totalSpent });
    });

    it("token transfer, useAllAmount = true", async () => {
      const mockedTokenCurrency = getMockedHTSTokenCurrency();
      const mockedTokenAccount = getMockedTokenAccount(mockedTokenCurrency);
      const mockedAccount = getMockedAccount({ subAccounts: [mockedTokenAccount] });
      const mockedTransaction = getMockedTransaction({
        useAllAmount: true,
        subAccountId: mockedTokenAccount.id,
      });

      const amount = mockedTokenAccount.balance;
      const totalSpent = amount;

      const result = await calculateAmount({
        account: mockedAccount,
        transaction: mockedTransaction,
      });

      expect(result).toEqual({ amount, totalSpent });
    });

    it("token transfer, useAllAmount = false", async () => {
      const mockedTokenCurrency = getMockedHTSTokenCurrency();
      const mockedTokenAccount = getMockedTokenAccount(mockedTokenCurrency);
      const mockedAccount = getMockedAccount({ subAccounts: [mockedTokenAccount] });
      const mockedTransaction = getMockedTransaction({
        useAllAmount: false,
        amount: new BigNumber(1),
        subAccountId: mockedTokenAccount.id,
      });

      const amount = mockedTransaction.amount;
      const totalSpent = amount;

      const result = await calculateAmount({
        account: mockedAccount,
        transaction: mockedTransaction,
      });

      expect(result).toEqual({ amount, totalSpent });
    });

    it("token associate operation uses TokenAssociate fee", async () => {
      const mockedTokenCurrency = getMockedHTSTokenCurrency();
      const mockedTokenAccount = getMockedTokenAccount(mockedTokenCurrency);
      const mockedAccount = getMockedAccount({ subAccounts: [mockedTokenAccount] });
      const mockedTransaction = getMockedTransaction({
        useAllAmount: false,
        amount: new BigNumber(1),
        mode: HEDERA_TRANSACTION_MODES.TokenAssociate,
        properties: {
          token: mockedTokenCurrency,
        },
      });

      const amount = mockedTransaction.amount;
      const totalSpent = amount.plus(estimatedFees.associate.tinybars);

      const result = await calculateAmount({
        account: mockedAccount,
        transaction: mockedTransaction,
      });

      expect(result).toEqual({ amount, totalSpent });
    });
  });

  describe("getSubAccounts", () => {
    it("returns sub account based on operations and mirror tokens", async () => {
      const firstTokenCurrencyFromCAL = getTokenCurrencyFromCAL(0);
      const secondTokenCurrencyFromCAL = getTokenCurrencyFromCAL(1);
      const mockedAccount = getMockedAccount();
      const mockedMirrorToken1 = getMockedMirrorToken({
        token_id: firstTokenCurrencyFromCAL.contractAddress,
        balance: 10,
      });
      const mockedMirrorToken2 = getMockedMirrorToken({
        token_id: secondTokenCurrencyFromCAL.contractAddress,
        balance: 0,
      });

      // Fetch actual tokens from CAL to get the real format
      const firstTokenFromCAL = await getCryptoAssetsStore().findTokenByAddressInCurrency(
        firstTokenCurrencyFromCAL.contractAddress,
        "hedera",
      );
      const secondTokenFromCAL = await getCryptoAssetsStore().findTokenByAddressInCurrency(
        secondTokenCurrencyFromCAL.contractAddress,
        "hedera",
      );

      if (!firstTokenFromCAL || !secondTokenFromCAL) {
        throw new Error("Tokens not found in CAL");
      }

      const mockedOperation1 = getMockedOperation({
        accountId: encodeTokenAccountId(mockedAccount.id, firstTokenFromCAL),
      });
      const mockedOperation2 = getMockedOperation({
        accountId: encodeTokenAccountId(mockedAccount.id, secondTokenFromCAL),
      });

      const result = await getSubAccounts({
        ledgerAccountId: mockedAccount.id,
        latestHTSTokenOperations: [mockedOperation1, mockedOperation2],
        latestERC20TokenOperations: [],
        mirrorTokens: [mockedMirrorToken1, mockedMirrorToken2],
        erc20Tokens: [],
      });
      const uniqueSubAccountIds = new Set(result.map(sa => sa.id));

      expect(uniqueSubAccountIds.size).toBe(result.length);
      expect(result).toHaveLength(2);
      expect(result).toMatchObject([
        {
          token: firstTokenCurrencyFromCAL,
          balance: new BigNumber(10),
          operations: [mockedOperation1],
        },
        {
          token: secondTokenCurrencyFromCAL,
          balance: new BigNumber(0),
          operations: [mockedOperation2],
        },
      ]);
    });

    it("ignores operation if token is not listed in CAL", async () => {
      const mockedTokenCurrency = getMockedHTSTokenCurrency();
      const mockedAccount = getMockedAccount();
      const mockedOperation = getMockedOperation({
        accountId: encodeTokenAccountId(mockedAccount.id, mockedTokenCurrency),
      });

      const result = await getSubAccounts({
        ledgerAccountId: mockedAccount.id,
        latestHTSTokenOperations: [mockedOperation],
        latestERC20TokenOperations: [],
        mirrorTokens: [],
        erc20Tokens: [],
      });

      expect(result).toEqual([]);
    });

    it("returns sub account for mirror token with no operations yet (e.g. right after association)", async () => {
      const tokenCurrencyFromCAL = getTokenCurrencyFromCAL(0);
      const mockedAccount = getMockedAccount();
      const mockedTokenHTS = getMockedMirrorToken({
        token_id: tokenCurrencyFromCAL.contractAddress,
        balance: 42,
      });

      const result = await getSubAccounts({
        ledgerAccountId: mockedAccount.id,
        latestHTSTokenOperations: [],
        latestERC20TokenOperations: [],
        mirrorTokens: [mockedTokenHTS],
        erc20Tokens: [],
      });

      expect(result).toMatchObject([
        {
          token: tokenCurrencyFromCAL,
          operations: [],
          balance: new BigNumber(42),
        },
      ]);
    });

    it("returns sub account for erc20 token with no operations yet", async () => {
      const tokenCurrencyFromCAL = getTokenCurrencyFromCALByType("erc20");
      const mockedAccount = getMockedAccount();

      const result = await getSubAccounts({
        ledgerAccountId: mockedAccount.id,
        latestHTSTokenOperations: [],
        latestERC20TokenOperations: [],
        mirrorTokens: [],
        erc20Tokens: [{ balance: new BigNumber(42), token: tokenCurrencyFromCAL }],
      });

      expect(result).toMatchObject([
        {
          token: tokenCurrencyFromCAL,
          operations: [],
          balance: new BigNumber(42),
        },
      ]);
    });
  });

  describe("integrateERC20Operations", () => {
    const address = "0.0.12345";
    const evmAddress = "0x0000000000000000000000000000000000003039";
    const ledgerAccountId = `js:2:hedera:${address}:`;
    const tokenCurrency = getTokenCurrencyFromCALByType("erc20");

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("creates new operation for erc20 in transfer", async () => {
      const mockGetContractCallResult = jest.spyOn(apiClient, "getContractCallResult");
      const mockFindTransactionByContractCall = jest.spyOn(
        apiClient,
        "findTransactionByContractCall",
      );

      const incomingTxConsensusTimestamp = `1705836000.000000000`;
      const incomingTxHash = "incoming_erc20";
      const incomingTxValue = "3000000";
      const incomingTxFrom = "0xSENDER";
      const incomingTxTo = evmAddress;
      const incomingERC20Transaction = getMockedThirdwebTransaction({
        transactionHash: incomingTxHash,
        address: tokenCurrency.contractAddress,
        blockHash: "0xINCOMING_BLOCK",
        blockNumber: 12345,
        decoded: {
          name: "Transfer",
          signature: "Transfer(address,address,uint256)",
          params: {
            from: incomingTxFrom,
            to: incomingTxTo,
            value: incomingTxValue,
          },
        },
      });
      const oldMirrorOperations = [
        getMockedOperation({
          hash: "normal_tx",
          type: "IN",
          date: new Date("2024-01-20T10:00:00Z"),
        }),
      ];

      mockGetContractCallResult.mockResolvedValue({
        timestamp: incomingTxConsensusTimestamp,
        contract_id: tokenCurrency.contractAddress,
      } as any);

      mockFindTransactionByContractCall.mockResolvedValue({
        transaction_hash: incomingTxHash,
        consensus_timestamp: incomingTxConsensusTimestamp,
      } as any);

      const { updatedOperations, newERC20TokenOperations } = await integrateERC20Operations({
        ledgerAccountId,
        address,
        allOperations: oldMirrorOperations,
        latestERC20Operations: await getERC20Operations([incomingERC20Transaction]),
        pendingOperationHashes: new Set(),
        erc20OperationHashes: new Set(),
      });

      const incomingOp = updatedOperations.find(op => op.hash === incomingTxHash);

      expect(incomingOp).toMatchObject({
        type: "NONE",
        hash: incomingTxHash,
        blockHash: incomingERC20Transaction.blockHash,
      });
      expect(incomingOp?.subOperations).toMatchObject([
        {
          type: "IN",
          hash: incomingTxHash,
          blockHash: incomingERC20Transaction.blockHash,
          standard: "erc20",
          value: new BigNumber(incomingTxValue),
          senders: [incomingTxFrom],
          recipients: [address],
        },
      ]);
      expect(newERC20TokenOperations).toMatchObject([incomingOp?.subOperations?.[0]]);
      expect(updatedOperations).toHaveLength(oldMirrorOperations.length + 1);
    });

    it("creates new operation for erc20 out transfer (not made by user)", async () => {
      const mockGetContractCallResult = jest.spyOn(apiClient, "getContractCallResult");
      const mockFindTransactionByContractCall = jest.spyOn(
        apiClient,
        "findTransactionByContractCall",
      );

      const allowanceTxConsensusTimestamp = "1705922400.000000000";
      const allowanceTxHash = "transfer_by_allowance";
      const allowanceTxValue = "2000000";
      const allowanceTxFrom = evmAddress;
      const allowanceTxTo = "0xRECIPIENT";

      const oldMirrorOperations = [
        getMockedOperation({
          hash: "normal_tx",
          type: "OUT",
          date: new Date("2024-01-20T10:00:00Z"),
        }),
      ];

      const allowanceERC20Transaction = getMockedThirdwebTransaction({
        transactionHash: allowanceTxHash,
        address: tokenCurrency.contractAddress,
        blockHash: "0xALLOWANCE_BLOCK",
        blockNumber: 12346,
        decoded: {
          name: "Transfer",
          signature: "Transfer(address,address,uint256)",
          params: {
            from: allowanceTxFrom,
            to: allowanceTxTo,
            value: allowanceTxValue,
          },
        },
      });

      mockGetContractCallResult.mockResolvedValue({
        timestamp: allowanceTxConsensusTimestamp,
        contract_id: tokenCurrency.contractAddress,
      } as any);

      mockFindTransactionByContractCall.mockResolvedValue({
        transaction_hash: allowanceTxHash,
        consensus_timestamp: allowanceTxConsensusTimestamp,
      } as any);

      const { updatedOperations, newERC20TokenOperations } = await integrateERC20Operations({
        ledgerAccountId,
        address,
        allOperations: oldMirrorOperations,
        latestERC20Operations: await getERC20Operations([allowanceERC20Transaction]),
        pendingOperationHashes: new Set(),
        erc20OperationHashes: new Set(),
      });

      const allowanceOp = updatedOperations.find(op => op.hash === allowanceTxHash);

      expect(allowanceOp).toMatchObject({
        type: "FEES",
        hash: allowanceTxHash,
        blockHash: allowanceERC20Transaction.blockHash,
        standard: "erc20",
      });
      expect(allowanceOp?.subOperations).toMatchObject([
        {
          type: "OUT",
          hash: allowanceTxHash,
          blockHash: allowanceERC20Transaction.blockHash,
          standard: "erc20",
          value: new BigNumber(allowanceTxValue),
          senders: [address],
          recipients: [allowanceTxTo],
        },
      ]);
      expect(newERC20TokenOperations).toMatchObject([allowanceOp?.subOperations?.[0]]);
      expect(updatedOperations).toHaveLength(oldMirrorOperations.length + 1);
    });

    it("avoids duplicated CONTRACT_CALL operation if confirmed erc20 operation exists", async () => {
      const mockGetContractCallResult = jest.spyOn(apiClient, "getContractCallResult");
      const mockFindTransactionByContractCall = jest.spyOn(
        apiClient,
        "findTransactionByContractCall",
      );

      const duplicateTxConsensusTimestamp = "1705836000.000000000";
      const duplicateTxHash = "duplicate_tx";

      const operationsWithDuplicate = [
        getMockedOperation({
          hash: duplicateTxHash,
          type: "FEES",
          standard: "erc20",
          date: new Date("2024-01-20T10:00:00Z"),
          blockHash: "0xBLOCK",
          subOperations: [
            getMockedOperation({
              type: "OUT",
              standard: "erc20",
              hash: duplicateTxHash,
              accountId: encodeTokenAccountId(ledgerAccountId, tokenCurrency),
            }),
          ],
        }),
        getMockedOperation({
          hash: duplicateTxHash,
          type: "CONTRACT_CALL",
          date: new Date("2024-01-20T10:00:00Z"),
        }),
        getMockedOperation({
          hash: "unique_tx",
          type: "OUT",
          date: new Date("2024-01-19T10:00:00Z"),
        }),
      ];

      const duplicateERC20Transaction = getMockedThirdwebTransaction({
        transactionHash: duplicateTxHash,
        address: tokenCurrency.contractAddress,
        blockHash: "0xBLOCK",
        decoded: {
          name: "Transfer",
          signature: "Transfer(address,address,uint256)",
          params: {
            from: evmAddress,
            to: "0xRECIPIENT",
            value: "1000000",
          },
        },
      });

      mockGetContractCallResult.mockResolvedValue({
        timestamp: duplicateTxConsensusTimestamp,
        contract_id: tokenCurrency.contractAddress,
      } as any);

      mockFindTransactionByContractCall.mockResolvedValue({
        transaction_hash: duplicateTxHash,
        consensus_timestamp: duplicateTxConsensusTimestamp,
      } as any);

      const { updatedOperations } = await integrateERC20Operations({
        ledgerAccountId,
        address,
        allOperations: operationsWithDuplicate,
        latestERC20Operations: await getERC20Operations([duplicateERC20Transaction]),
        pendingOperationHashes: new Set(),
        erc20OperationHashes: new Set([duplicateTxHash]),
      });

      const duplicatedContractCalls = updatedOperations.filter(
        op => op.type === "CONTRACT_CALL" && op.hash === duplicateTxHash,
      );
      const feesOps = updatedOperations.filter(
        op => op.type === "FEES" && op.hash === duplicateTxHash,
      );

      expect(updatedOperations).toHaveLength(2);
      expect(duplicatedContractCalls).toEqual([]);
      expect(feesOps).toHaveLength(1);
      expect(feesOps).toMatchObject([{ blockHash: "0xBLOCK" }]);
    });

    it("avoids duplicated CONTRACT_CALL operation if erc20 operation is pending", async () => {
      const pendingTxHash = "pending_erc20";

      const operationsWithPending = [
        getMockedOperation({
          hash: pendingTxHash,
          type: "CONTRACT_CALL",
          date: new Date("2024-01-20T10:00:00Z"),
        }),
        getMockedOperation({
          hash: "confirmed_tx",
          type: "OUT",
          date: new Date("2024-01-19T10:00:00Z"),
        }),
      ];

      const { updatedOperations } = await integrateERC20Operations({
        ledgerAccountId,
        address,
        allOperations: operationsWithPending,
        latestERC20Operations: [],
        pendingOperationHashes: new Set([pendingTxHash]),
        erc20OperationHashes: new Set(),
      });

      const pendingOp = updatedOperations.find(op => op.hash === pendingTxHash);

      expect(pendingOp).toBeUndefined();
      expect(updatedOperations).toHaveLength(1);
      expect(updatedOperations).toMatchObject([{ hash: "confirmed_tx" }]);
    });

    /**
     * Timeline:
     * - Tuesday: Normal transactions
     * - Wednesday: ERC20 transfer (Mirror + Thirdweb in sync)
     * - Thursday: Normal transaction
     * - Friday: ERC20 transfer (Thirdweb stuck - no event)
     * - Saturday: Normal transaction
     *
     * SYNC 1 (Friday):
     * - Mirror Node shows CONTRACT_CALL without blockHash
     * - Thirdweb has no event yet (indexer stuck)
     * - Operation remains as CONTRACT_CALL (not enriched)
     *
     * SYNC 2 (Saturday):
     * - Thirdweb catches up and returns Friday's event
     * - CONTRACT_CALL should get patched to FEES with ERC20 sub-operation
     */
    it("handles delayed thirdweb indexer", async () => {
      const mockGetContractCallResult = jest.spyOn(apiClient, "getContractCallResult");
      const mockFindTransactionByContractCall = jest.spyOn(
        apiClient,
        "findTransactionByContractCall",
      );

      const fridayTxConsensusTimestamp = `1705678200.000000000`;

      // sync 1 from Friday: thirdweb hasn't indexed yet
      const fridaySyncOperations = [
        getMockedOperation({
          hash: "saturday_tx",
          type: "OUT",
          date: new Date("2024-01-20T10:00:00Z"),
        }),
        getMockedOperation({
          hash: "friday_erc20",
          type: "CONTRACT_CALL",
          date: new Date("2024-01-19T15:30:00Z"),
        }),
        getMockedOperation({
          hash: "thursday_tx",
          type: "OUT",
          date: new Date("2024-01-18T12:00:00Z"),
        }),
        getMockedOperation({
          hash: "wednesday_erc20",
          type: "FEES",
          date: new Date("2024-01-17T09:00:00Z"),
          standard: "erc20",
          blockHash: "0xWEDNESDAY_BLOCK",
          subOperations: [
            getMockedOperation({
              type: "OUT",
              standard: "erc20",
              hash: "wednesday_erc20",
              accountId: encodeTokenAccountId(ledgerAccountId, tokenCurrency),
            }),
          ],
        }),
        getMockedOperation({
          hash: "tuesday_tx",
          type: "OUT",
          date: new Date("2024-01-16T08:00:00Z"),
        }),
      ];

      // thirdweb catches up with Friday's event
      const lateERC20Transaction = getMockedThirdwebTransaction({
        transactionHash: "friday_erc20",
        address: tokenCurrency.contractAddress,
        decoded: {
          name: "Transfer",
          signature: "Transfer(address,address,uint256)",
          params: {
            from: evmAddress,
            to: "0xRECIPIENT",
            value: "5000000",
          },
        },
      });

      mockGetContractCallResult.mockResolvedValue({
        timestamp: fridayTxConsensusTimestamp,
        contract_id: tokenCurrency.contractAddress,
      } as any);

      mockFindTransactionByContractCall.mockResolvedValue({
        transaction_hash: lateERC20Transaction.transactionHash,
        consensus_timestamp: fridayTxConsensusTimestamp,
      } as any);

      const { updatedOperations, newERC20TokenOperations } = await integrateERC20Operations({
        ledgerAccountId,
        address,
        allOperations: fridaySyncOperations,
        latestERC20Operations: await getERC20Operations([lateERC20Transaction]),
        pendingOperationHashes: new Set(),
        erc20OperationHashes: new Set(["wednesday_erc20"]),
      });

      // check if friday operation got patched
      const wednesdayOp = updatedOperations.find(op => op.hash === "wednesday_erc20");
      const fridayOp = updatedOperations.find(
        op => op.hash === lateERC20Transaction.transactionHash,
      );

      expect(fridayOp).toMatchObject({
        type: "FEES",
        standard: "erc20",
        hash: lateERC20Transaction.transactionHash,
        subOperations: [
          {
            type: "OUT",
            standard: "erc20",
          },
        ],
      });
      expect(newERC20TokenOperations).toMatchObject([
        {
          type: "OUT",
          hash: lateERC20Transaction.transactionHash,
          accountId: encodeTokenAccountId(ledgerAccountId, tokenCurrency),
        },
      ]);
      expect(wednesdayOp).toMatchObject({
        type: "FEES",
        blockHash: "0xWEDNESDAY_BLOCK",
      });
      expect(updatedOperations[0]).toMatchObject({ hash: "saturday_tx" });
      expect(updatedOperations.at(-1)).toMatchObject({ hash: "tuesday_tx" });
      expect(updatedOperations).toHaveLength(fridaySyncOperations.length);
    });
  });
});

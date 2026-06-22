import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { encodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import BigNumber from "bignumber.js";
import { getMockedAccount, getMockedTokenAccount } from "../test/fixtures/account.fixture";
import {
  getMockedERC20TokenCurrency,
  getMockedHTSTokenCurrency,
  getTokenCurrencyFromCALByType,
} from "../test/fixtures/currency.fixture";
import { getMockedOperation } from "../test/fixtures/operation.fixture";
import type { HederaOperationExtra } from "../types";
import {
  applyPendingExtras,
  buildCalTokenMap,
  mergeSubAccounts,
  patchOperationWithExtra,
  prepareOperations,
  resolveBridgeOperations,
} from "./utils";
import { getMockedMirrorToken } from "../test/fixtures/mirror.fixture";

describe("bridge utils", () => {
  describe("prepareOperations", () => {
    const tokenCurrencyFromCAL = getTokenCurrencyFromCALByType("hts");

    beforeAll(() => {
      setupMockCryptoAssetsStore({
        findTokenByAddressInCurrency: jest
          .fn()
          .mockImplementation(async () => tokenCurrencyFromCAL),
      });
    });

    it("links token operation to existing coin operation with matching hash", async () => {
      const mockedTokenAccount = getMockedTokenAccount(tokenCurrencyFromCAL);
      const mockedCoinOperation = getMockedOperation({ hash: "shared" });
      const mockedTokenOperation = getMockedOperation({
        hash: "shared",
        accountId: encodeTokenAccountId(mockedTokenAccount.parentId, tokenCurrencyFromCAL),
      });

      const result = await prepareOperations([mockedCoinOperation], [mockedTokenOperation]);

      expect(result).toHaveLength(1);
      expect(result[0].subOperations).toEqual([mockedTokenOperation]);
    });

    it("creates NONE coin operation as parent if no coin op with matching hash exists", async () => {
      const mockedTokenAccount = getMockedTokenAccount(tokenCurrencyFromCAL);
      const mockedOrphanTokenOperation = getMockedOperation({
        hash: "unknown-hash",
        accountId: encodeTokenAccountId(mockedTokenAccount.parentId, tokenCurrencyFromCAL),
      });

      const result = await prepareOperations([], [mockedOrphanTokenOperation]);
      const noneOp = result.find(op => op.type === "NONE");

      expect(typeof noneOp).toBe("object");
      expect(noneOp).not.toBeNull();
      expect(noneOp?.subOperations?.[0]).toEqual(mockedOrphanTokenOperation);
      expect(noneOp?.hash).toBe("unknown-hash");
    });
  });

  describe("mergeSubAccounts", () => {
    it("returns newSubAccounts if no initial account exists", () => {
      const mockedTokenCurrency1 = getMockedHTSTokenCurrency({ id: "token1" });
      const mockedTokenCurrency2 = getMockedHTSTokenCurrency({ id: "token2" });
      const mockedTokenAccount1 = getMockedTokenAccount(mockedTokenCurrency1, { id: "ta1" });
      const mockedTokenAccount2 = getMockedTokenAccount(mockedTokenCurrency2, { id: "ta2" });
      const initialAccount = undefined;
      const newSubAccounts = [mockedTokenAccount1, mockedTokenAccount2];

      const result = mergeSubAccounts(initialAccount, newSubAccounts);

      expect(result).toEqual(newSubAccounts);
    });

    it("merges operations and updates only changed fields", () => {
      const mockedTokenCurrency = getMockedHTSTokenCurrency();
      const existingOperation = getMockedOperation({ id: "op1" });
      const newOperation = getMockedOperation({ id: "op2" });
      const newPendingOperation = getMockedOperation({ id: "op3" });
      const existingTokenAccount = getMockedTokenAccount(mockedTokenCurrency, {
        id: "tokenaccount",
        balance: new BigNumber(1000),
        creationDate: new Date(),
        operations: [existingOperation],
        pendingOperations: [],
      });
      const updatedTokenAccount = getMockedTokenAccount(mockedTokenCurrency, {
        id: "tokenaccount",
        balance: new BigNumber(2000),
        creationDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        operations: [newOperation],
        pendingOperations: [newPendingOperation],
      });
      const mockedAccount = getMockedAccount({ subAccounts: [existingTokenAccount] });

      const result = mergeSubAccounts(mockedAccount, [updatedTokenAccount]);
      const merged = result[0];

      expect(result).toHaveLength(1);
      expect(merged.creationDate).toEqual(existingTokenAccount.creationDate);
      expect(merged.balance).toEqual(new BigNumber(2000));
      expect(merged.pendingOperations.map(op => op.id)).toEqual(["op3"]);
      expect(merged.operations.map(op => op.id)).toEqual(["op2", "op1"]);
      expect(merged.operationsCount).toEqual(2);
    });

    it("adds new sub accounts that are not present in initial account", () => {
      const existingToken = getMockedHTSTokenCurrency({ id: "token1" });
      const newToken = getMockedHTSTokenCurrency({ id: "token2" });
      const existingTokenAccount = getMockedTokenAccount(existingToken, { id: "ta1" });
      const newTokenAccount = getMockedTokenAccount(newToken, { id: "ta2" });
      const mockedAccount = getMockedAccount({ subAccounts: [existingTokenAccount] });

      const result = mergeSubAccounts(mockedAccount, [existingTokenAccount, newTokenAccount]);

      expect(result.map(sa => sa.id)).toEqual(["ta1", "ta2"]);
    });
  });

  describe("applyPendingExtras", () => {
    it("merges valid extras from pending operations", () => {
      const opExtra1: HederaOperationExtra = { consensusTimestamp: "1.2.3.4" };
      const pendingExtra1: HederaOperationExtra = { associatedTokenId: "0.0.1234" };

      const mockedOperation1 = getMockedOperation({ hash: "op1", extra: opExtra1 });
      const mockedPendingOperation1 = getMockedOperation({ hash: "op1", extra: pendingExtra1 });

      const result = applyPendingExtras([mockedOperation1], [mockedPendingOperation1]);

      expect(result).toHaveLength(1);
      expect(result[0].extra).toEqual({
        ...mockedOperation1.extra,
        ...mockedPendingOperation1.extra,
      });
    });

    it("returns original operation if no matching pending is found", () => {
      const opExtra: HederaOperationExtra = { consensusTimestamp: "1.2.3.4" };
      const pendingExtra: HederaOperationExtra = { associatedTokenId: "0.0.1234" };

      const mockedOperation = getMockedOperation({ hash: "unknown", extra: opExtra });
      const mockedPendingOperation = getMockedOperation({ hash: "op1", extra: pendingExtra });

      const result = applyPendingExtras([mockedOperation], [mockedPendingOperation]);
      expect(result).toHaveLength(1);
      expect(result[0].extra).toEqual(mockedOperation.extra);
    });
  });

  describe("buildCalTokenMap", () => {
    it("returns empty map for empty input", async () => {
      const result = await buildCalTokenMap({
        erc20Tokens: [],
        mirrorTokens: [],
        currencyId: "hedera",
      });

      expect(result.size).toBe(0);
    });

    it("resolves erc20 and hts tokens, skips addresses not in CAL", async () => {
      const erc20Token = getMockedERC20TokenCurrency({ contractAddress: "0xabc" });
      const htsToken = getMockedHTSTokenCurrency({ contractAddress: "0.0.1001" });
      const mockMirrorToken = getMockedMirrorToken({
        token_id: htsToken.contractAddress,
        balance: 500,
      });

      setupMockCryptoAssetsStore({
        findTokenByAddressInCurrency: jest.fn().mockImplementation(async (address: string) => {
          if (address === erc20Token.contractAddress) return erc20Token;
          if (address === htsToken.contractAddress) return htsToken;
          return undefined;
        }),
      });

      const result = await buildCalTokenMap({
        erc20Tokens: [
          { contractAddress: erc20Token.contractAddress, balance: new BigNumber(100) },
          { contractAddress: "0x999", balance: new BigNumber(50) },
        ],
        mirrorTokens: [mockMirrorToken],
        currencyId: "hedera",
      });

      expect(result.size).toBe(2);
      expect(result.get(erc20Token.contractAddress)).toBe(erc20Token);
      expect(result.get(htsToken.contractAddress)).toBe(htsToken);
    });

    it("deduplicates addresses case-insensitively", async () => {
      const mockToken = getMockedERC20TokenCurrency({ contractAddress: "0xABC" });
      const findMock = jest.fn().mockResolvedValue(mockToken);

      setupMockCryptoAssetsStore({ findTokenByAddressInCurrency: findMock });

      await buildCalTokenMap({
        erc20Tokens: [
          { contractAddress: "0xABC", balance: new BigNumber(1) },
          { contractAddress: "0xabc", balance: new BigNumber(2) },
        ],
        mirrorTokens: [],
        currencyId: "hedera",
      });

      expect(findMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("resolveBridgeOperations", () => {
    const ledgerAccountId = "js:2:hedera:0.0.12345:";

    it("re-encodes coin operation accountId and id to ledgerAccountId", () => {
      const coinOp = getMockedOperation({ hash: "h1", type: "OUT" });

      const { bridgeCoinOperations } = resolveBridgeOperations({
        coinOperations: [coinOp],
        tokenOperations: [],
        ledgerAccountId,
        calTokenByAddress: new Map(),
      });

      expect(bridgeCoinOperations).toEqual([
        expect.objectContaining({
          accountId: ledgerAccountId,
          id: encodeOperationId(ledgerAccountId, coinOp.hash, coinOp.type),
        }),
      ]);
    });

    it("drops token operations without a contract address", () => {
      const tokenOp = getMockedOperation({ hash: "h1", type: "IN" });

      const { bridgeTokenOperations } = resolveBridgeOperations({
        coinOperations: [],
        tokenOperations: [tokenOp],
        ledgerAccountId,
        calTokenByAddress: new Map(),
      });

      expect(bridgeTokenOperations).toEqual([]);
    });

    it("drops token operations for addresses not in calTokenByAddress", () => {
      const tokenOp = getMockedOperation({ hash: "h1", type: "OUT", contract: "0x999" });

      const { bridgeTokenOperations } = resolveBridgeOperations({
        coinOperations: [],
        tokenOperations: [tokenOp],
        ledgerAccountId,
        calTokenByAddress: new Map(),
      });

      expect(bridgeTokenOperations).toEqual([]);
    });

    it("re-encodes token operation accountId and id using encodeTokenAccountId", () => {
      const mockToken = getMockedHTSTokenCurrency({ contractAddress: "0.0.1001" });
      const tokenOp = getMockedOperation({
        hash: "txhash",
        type: "IN",
        contract: mockToken.contractAddress,
      });

      const { bridgeTokenOperations } = resolveBridgeOperations({
        coinOperations: [],
        tokenOperations: [tokenOp],
        ledgerAccountId,
        calTokenByAddress: new Map([[mockToken.contractAddress.toLowerCase(), mockToken]]),
      });

      const expectedTokenAccountId = encodeTokenAccountId(ledgerAccountId, mockToken);
      expect(bridgeTokenOperations).toEqual([
        expect.objectContaining({
          accountId: expectedTokenAccountId,
          id: encodeOperationId(expectedTokenAccountId, tokenOp.hash, tokenOp.type),
        }),
      ]);
    });

    it("filters mixed batch — keeps only tokens present in calTokenByAddress", () => {
      const erc20Token = getMockedERC20TokenCurrency({ contractAddress: "0xabc" });
      const htsToken = getMockedHTSTokenCurrency({ contractAddress: "0.0.1001" });

      const { bridgeTokenOperations } = resolveBridgeOperations({
        coinOperations: [],
        tokenOperations: [
          getMockedOperation({ hash: "h1", type: "IN", contract: erc20Token.contractAddress }),
          getMockedOperation({ hash: "h2", type: "IN", contract: htsToken.contractAddress }),
          getMockedOperation({ hash: "h3", type: "OUT", contract: "0.0.9999" }),
          getMockedOperation({ hash: "h4", type: "IN" }),
        ],
        ledgerAccountId,
        calTokenByAddress: new Map([
          [erc20Token.contractAddress.toLowerCase(), erc20Token],
          [htsToken.contractAddress, htsToken],
        ]),
      });

      expect(bridgeTokenOperations).toEqual([
        expect.objectContaining({ contract: erc20Token.contractAddress }),
        expect.objectContaining({ contract: htsToken.contractAddress }),
      ]);
    });

    it("drops FEES coin op when its token op is not in calTokenByAddress", () => {
      const tokenOp = getMockedOperation({ hash: "h1", type: "OUT", contract: "0x999" });
      const feesOp = getMockedOperation({ hash: "h1", type: "FEES" });

      const { bridgeCoinOperations, bridgeTokenOperations } = resolveBridgeOperations({
        coinOperations: [feesOp],
        tokenOperations: [tokenOp],
        ledgerAccountId,
        calTokenByAddress: new Map(),
      });

      expect(bridgeTokenOperations).toEqual([]);
      expect(bridgeCoinOperations).toEqual([]);
    });

    it("keeps FEES coin op when at least one token op for that hash is kept", () => {
      const keptToken = getMockedHTSTokenCurrency({ contractAddress: "0.0.1001" });
      const tokenOp = getMockedOperation({
        hash: "h1",
        type: "OUT",
        contract: keptToken.contractAddress,
      });
      const feesOp = getMockedOperation({ hash: "h1", type: "FEES" });

      const { bridgeCoinOperations } = resolveBridgeOperations({
        coinOperations: [feesOp],
        tokenOperations: [tokenOp],
        ledgerAccountId,
        calTokenByAddress: new Map([[keptToken.contractAddress, keptToken]]),
      });

      expect(bridgeCoinOperations).toEqual([expect.objectContaining({ hash: "h1", type: "FEES" })]);
    });
  });

  describe("patchOperationWithExtra", () => {
    it("adds extra to operation and nested sub operations", () => {
      const mockedOperation = getMockedOperation({
        hash: "parent",
        extra: {},
        subOperations: [getMockedOperation({ hash: "sub1", extra: {} })],
      });

      const extra: HederaOperationExtra = {
        consensusTimestamp: "12345",
        associatedTokenId: "0.0.1001",
      };

      const patched = patchOperationWithExtra(mockedOperation, extra);

      expect(patched.extra).toEqual(extra);
      expect(patched.subOperations).toHaveLength(1);
      expect(patched.subOperations?.[0].extra).toEqual(extra);
    });
  });
});

import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
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

const idsByValue = (ops: { value: BigNumber; id: string }[]) =>
  new Map(ops.map(op => [op.value.toString(), op.id]));

describe("bridge utils", () => {
  describe("prepareOperations", () => {
    const tokenCurrencyFromCAL = getTokenCurrencyFromCALByType("hts");

    beforeAll(() => {
      setCryptoAssetsStore({
        findTokenById: async () => undefined,
        findTokenByAddressInCurrency: jest
          .fn()
          .mockImplementation(async () => tokenCurrencyFromCAL),
        getTokensSyncHash: async () => "",
      });
    });

    it("should link the token operation to the existing FEES coin operation when hashes match", async () => {
      const mockedTokenAccount = getMockedTokenAccount(tokenCurrencyFromCAL);
      const mockedCoinOperation = getMockedOperation({ hash: "shared", type: "FEES" });
      const mockedTokenOperation = getMockedOperation({
        hash: "shared",
        accountId: encodeTokenAccountId(mockedTokenAccount.parentId, tokenCurrencyFromCAL),
      });

      const result = await prepareOperations([mockedCoinOperation], [mockedTokenOperation]);

      expect(result).toHaveLength(1);
      expect(result[0].subOperations).toEqual([mockedTokenOperation]);
    });

    it("should keep the coin operation standalone with no subOperations when a token operation shares its hash", async () => {
      const mockedTokenAccount = getMockedTokenAccount(tokenCurrencyFromCAL);
      const mockedCoinOperation = getMockedOperation({ hash: "shared", type: "OUT" });
      const mockedTokenOperation = getMockedOperation({
        hash: "shared",
        accountId: encodeTokenAccountId(mockedTokenAccount.parentId, tokenCurrencyFromCAL),
      });

      const result = await prepareOperations([mockedCoinOperation], [mockedTokenOperation]);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("OUT");
      expect(result[0].subOperations).toEqual([]);
    });

    it("should share one NONE parent operation when multiple orphan token operations share a hash", async () => {
      const mockedTokenAccount = getMockedTokenAccount(tokenCurrencyFromCAL);
      const tokenAccountId = encodeTokenAccountId(
        mockedTokenAccount.parentId,
        tokenCurrencyFromCAL,
      );
      const mockedTokenOperationA = getMockedOperation({
        hash: "orphan-hash",
        accountId: tokenAccountId,
      });
      const mockedTokenOperationB = getMockedOperation({
        hash: "orphan-hash",
        accountId: tokenAccountId,
      });

      const result = await prepareOperations([], [mockedTokenOperationA, mockedTokenOperationB]);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("NONE");
      expect(result[0].subOperations).toEqual([mockedTokenOperationA, mockedTokenOperationB]);
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

      setCryptoAssetsStore({
        findTokenById: async () => undefined,
        findTokenByAddressInCurrency: jest.fn().mockImplementation(async (address: string) => {
          if (address === erc20Token.contractAddress) return erc20Token;
          if (address === htsToken.contractAddress) return htsToken;
          return undefined;
        }),
        getTokensSyncHash: async () => "",
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

      setCryptoAssetsStore({
        findTokenById: async () => undefined,
        findTokenByAddressInCurrency: findMock,
        getTokensSyncHash: async () => "",
      });

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

    it("should keep a standalone FEES coin op when the tx has no token operations", () => {
      const feesOp = getMockedOperation({ hash: "h1", type: "FEES" });

      const { bridgeCoinOperations } = resolveBridgeOperations({
        coinOperations: [feesOp],
        tokenOperations: [],
        ledgerAccountId,
        calTokenByAddress: new Map(),
      });

      expect(bridgeCoinOperations).toEqual([expect.objectContaining({ hash: "h1", type: "FEES" })]);
    });

    it("should keep the clean tx hash on token ops and give them a unique id when an HBAR value op shares the hash", () => {
      const htsToken = getMockedHTSTokenCurrency({ contractAddress: "0.0.1001" });
      const coinOut = getMockedOperation({ hash: "h1", type: "OUT" });
      const tokenOp = getMockedOperation({
        hash: "h1",
        type: "OUT",
        contract: htsToken.contractAddress,
      });

      const { bridgeCoinOperations, bridgeTokenOperations } = resolveBridgeOperations({
        coinOperations: [coinOut],
        tokenOperations: [tokenOp],
        ledgerAccountId,
        calTokenByAddress: new Map([[htsToken.contractAddress, htsToken]]),
      });

      const expectedTokenAccountId = encodeTokenAccountId(ledgerAccountId, htsToken);
      expect(bridgeCoinOperations).toEqual([expect.objectContaining({ hash: "h1", type: "OUT" })]);
      expect(bridgeTokenOperations).toEqual([
        expect.objectContaining({
          hash: "h1",
          id: encodeOperationId(expectedTokenAccountId, "h1-token-anchor", "OUT"),
        }),
      ]);
      expect(bridgeTokenOperations[0].id).not.toBe(bridgeCoinOperations[0].id);
    });

    it("should keep the raw hash on token ops when only a FEES op shares it", () => {
      const htsToken = getMockedHTSTokenCurrency({ contractAddress: "0.0.1001" });
      const feesOp = getMockedOperation({ hash: "h1", type: "FEES" });
      const tokenOp = getMockedOperation({
        hash: "h1",
        type: "OUT",
        contract: htsToken.contractAddress,
      });

      const { bridgeCoinOperations, bridgeTokenOperations } = resolveBridgeOperations({
        coinOperations: [feesOp],
        tokenOperations: [tokenOp],
        ledgerAccountId,
        calTokenByAddress: new Map([[htsToken.contractAddress, htsToken]]),
      });

      expect(bridgeCoinOperations).toEqual([expect.objectContaining({ hash: "h1", type: "FEES" })]);
      expect(bridgeTokenOperations).toEqual([expect.objectContaining({ hash: "h1" })]);
    });

    it("should keep the HBAR OUT standalone with no NONE anchor when a token op shares its hash, end to end", async () => {
      const htsToken = getTokenCurrencyFromCALByType("hts");
      const coinOut = getMockedOperation({ hash: "h1", type: "OUT" });
      const tokenOp = getMockedOperation({
        hash: "h1",
        type: "OUT",
        contract: htsToken.contractAddress,
      });

      const { bridgeCoinOperations, bridgeTokenOperations } = resolveBridgeOperations({
        coinOperations: [coinOut],
        tokenOperations: [tokenOp],
        ledgerAccountId,
        calTokenByAddress: new Map([[htsToken.contractAddress, htsToken]]),
      });
      const result = await prepareOperations(bridgeCoinOperations, bridgeTokenOperations);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("OUT");
      expect(result[0].hash).toBe("h1");
      expect(result[0].subOperations).toEqual([]);
      expect(bridgeTokenOperations).toEqual([expect.objectContaining({ hash: "h1" })]);
    });

    it("should keep split fan-out coin ops with distinct ids when hash and type match but recipients differ", () => {
      const split1 = getMockedOperation({
        hash: "h1",
        type: "OUT",
        recipients: ["0.0.6855655"],
      });
      const split2 = getMockedOperation({
        hash: "h1",
        type: "OUT",
        recipients: ["0.0.9509310"],
      });

      const { bridgeCoinOperations } = resolveBridgeOperations({
        coinOperations: [split1, split2],
        tokenOperations: [],
        ledgerAccountId,
        calTokenByAddress: new Map(),
      });

      expect(bridgeCoinOperations).toHaveLength(2);
      const ids = bridgeCoinOperations.map(op => op.id);
      expect(new Set(ids).size).toBe(2);
      expect(ids).toEqual([
        `${encodeOperationId(ledgerAccountId, "h1", "OUT")}-0.0.6855655`,
        `${encodeOperationId(ledgerAccountId, "h1", "OUT")}-0.0.9509310`,
      ]);
    });

    it("should keep split fan-out token ops distinct when the same token, hash and type differ only by recipient", () => {
      const htsToken = getMockedHTSTokenCurrency({ contractAddress: "0.0.1001" });
      const split1 = getMockedOperation({
        hash: "h1",
        type: "OUT",
        contract: htsToken.contractAddress,
        recipients: ["0.0.6855655"],
      });
      const split2 = getMockedOperation({
        hash: "h1",
        type: "OUT",
        contract: htsToken.contractAddress,
        recipients: ["0.0.9509310"],
      });

      const { bridgeTokenOperations } = resolveBridgeOperations({
        coinOperations: [],
        tokenOperations: [split1, split2],
        ledgerAccountId,
        calTokenByAddress: new Map([[htsToken.contractAddress, htsToken]]),
      });

      const expectedTokenAccountId = encodeTokenAccountId(ledgerAccountId, htsToken);
      expect(bridgeTokenOperations).toHaveLength(2);
      expect(new Set(bridgeTokenOperations.map(op => op.id)).size).toBe(2);
      expect(bridgeTokenOperations.map(op => op.id)).toEqual([
        `${encodeOperationId(expectedTokenAccountId, "h1", "OUT")}-0.0.6855655`,
        `${encodeOperationId(expectedTokenAccountId, "h1", "OUT")}-0.0.9509310`,
      ]);
    });

    it("should derive the same fallback discriminator from the operation's value regardless of array order", () => {
      const opA = getMockedOperation({
        hash: "h1",
        type: "OUT",
        recipients: [],
        value: new BigNumber(100),
      });
      const opB = getMockedOperation({
        hash: "h1",
        type: "OUT",
        recipients: [],
        value: new BigNumber(200),
      });

      const forward = resolveBridgeOperations({
        coinOperations: [opA, opB],
        tokenOperations: [],
        ledgerAccountId,
        calTokenByAddress: new Map(),
      });
      const reversed = resolveBridgeOperations({
        coinOperations: [opB, opA],
        tokenOperations: [],
        ledgerAccountId,
        calTokenByAddress: new Map(),
      });

      expect(idsByValue(forward.bridgeCoinOperations)).toEqual(
        idsByValue(reversed.bridgeCoinOperations),
      );
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

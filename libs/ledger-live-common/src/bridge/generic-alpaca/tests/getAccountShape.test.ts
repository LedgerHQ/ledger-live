import BigNumber from "bignumber.js";
import { genericGetAccountShape } from "../getAccountShape";

const getSyncHashMock = jest.fn();
jest.mock("@ledgerhq/coin-framework/account/index", () => ({
  encodeAccountId: jest.fn(() => "accId"),
  getSyncHash: (...args: any[]) => getSyncHashMock(...args),
}));

const mergeOpsMock = jest.fn();
jest.mock("@ledgerhq/coin-framework/bridge/jsHelpers", () => ({
  mergeOps: (...args: any[]) => mergeOpsMock(...args),
}));

const listOperationsMock = jest.fn();
const getBalanceMock = jest.fn();
const lastBlockMock = jest.fn();
const getTokenFromAssetMock = jest.fn();
const chainSpecificGetAccountShapeMock = jest.fn();
const refreshOperationsMock = jest.fn();
jest.mock("../alpaca", () => ({
  getAlpacaApi: () => ({
    lastBlock: (...a: any[]) => lastBlockMock(...a),
    getBalance: (...a: any[]) => getBalanceMock(...a),
    listOperations: (...a: any[]) => listOperationsMock(...a),
    getTokenFromAsset: (...a: any[]) => getTokenFromAssetMock(...a),
    refreshOperations: (...a: any[]) => refreshOperationsMock(...a),
    getChainSpecificRules: () => ({
      getAccountShape: (...a: any[]) => chainSpecificGetAccountShapeMock(...a),
    }),
  }),
}));

const adaptCoreOperationToLiveOperationMock = jest.fn();
const extractBalanceMock = jest.fn();
const cleanedOperationMock = jest.fn();
jest.mock("../utils", () => ({
  adaptCoreOperationToLiveOperation: (...a: any[]) => adaptCoreOperationToLiveOperationMock(...a),
  extractBalance: (...a: any[]) => extractBalanceMock(...a),
  cleanedOperation: (...a: any[]) => cleanedOperationMock(...a),
}));

const inferSubOperationsMock = jest.fn();
jest.mock("@ledgerhq/coin-framework/serialization", () => ({
  inferSubOperations: (...a: any[]) => inferSubOperationsMock(...a),
}));

const buildSubAccountsMock = jest.fn();
const mergeSubAccountsMock = jest.fn();
jest.mock("../buildSubAccounts", () => ({
  buildSubAccounts: (...a: any[]) => buildSubAccountsMock(...a),
  mergeSubAccounts: (...a: any[]) => mergeSubAccountsMock(...a),
}));

// Test matrix for Stellar & XRP
const chains = [
  { currency: { id: "stellar", name: "Stellar" }, network: "testnet" },
  { currency: { id: "ripple", name: "XRP" }, network: "mainnet" },
  { currency: { id: "tezos", name: "Tezos" }, network: "mainnet" },
];

describe("genericGetAccountShape", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe.each(chains)("$currency.id", ({ currency, network }) => {
    test.each([
      [
        "an up-to-date sync hash",
        "sync-hash",
        {
          minHeight: 11,
          order: "desc",
          cursor: "pt1",
        },
        [
          {
            hash: "h0",
            type: "OUT",
            blockHeight: 12,
          },
          {
            hash: "h2",
            type: "OUT",
            blockHeight: 12,
            subOperations: [{ id: `${currency.id}_subOp1` }],
            extra: { assetReference: "ar2", assetOwner: "ow2" },
          },
          {
            blockHeight: 16,
            hash: "h4",
            type: "IN",
          },
          {
            hash: "h1",
            blockHeight: 10,
            type: "OPT_IN",
            extra: { pagingToken: "pt1", assetReference: "ar1", assetOwner: "ow1" },
          },
        ],
      ],
      [
        "an outdated sync hash",
        "outdated-sync-hash",
        {
          minHeight: 0,
          order: "desc",
        },
        [
          {
            hash: "h0",
            type: "OUT",
            blockHeight: 12,
          },
          {
            hash: "h2",
            type: "OUT",
            blockHeight: 12,
            subOperations: [{ id: `${currency.id}_subOp1` }],
            extra: { assetReference: "ar2", assetOwner: "ow2" },
          },
          {
            blockHeight: 16,
            hash: "h4",
            type: "IN",
          },
        ],
      ],
    ])(
      "builds account shape with existing operations, pagination and sub accounts from %s",
      async (_s, syncHash, expectedPagination, expectedOperations) => {
        const oldOp = {
          hash: "h1",
          blockHeight: 10,
          type: "OPT_IN",
          extra: { pagingToken: "pt1", assetReference: "ar1", assetOwner: "ow1" },
        };
        const pendingOp = {
          hash: "h0",
          blockHeight: 10,
          type: "OUT",
        };
        const initialAccount = {
          operations: [oldOp],
          pendingOperations: [pendingOp],
          blockHeight: 10,
          syncHash,
        };

        getSyncHashMock.mockReturnValue("sync-hash");
        extractBalanceMock.mockReturnValue({ value: 1000n, locked: 300n });
        getBalanceMock.mockResolvedValue([
          { asset: { type: "native" }, value: 1000n, locked: 300n },
          { asset: { type: "token", symbol: "TOK1" }, value: 42n },
          { asset: { type: "token", symbol: "TOK_IGNORE" }, value: 5n },
        ]);

        getTokenFromAssetMock.mockImplementation(asset =>
          asset.symbol === "TOK1" ? { id: `${currency.id}_token1` } : null,
        );

        listOperationsMock.mockResolvedValue({
          items: [
            { hash: "h2", type: "OUT", height: 12 },
            { hash: "h3", type: "IN", tx: { failed: true }, height: 14 }, // won't appear in final shape
            { hash: "h4", type: "IN", tx: { failed: false }, height: 16 },
          ],
          next: undefined,
        });
        refreshOperationsMock.mockImplementation(ops => {
          const op = ops[0];
          if (op?.hash === "h0") {
            return [{ ...op, blockHeight: 12 }];
          }
          return [];
        });

        adaptCoreOperationToLiveOperationMock.mockImplementation((_accId, op) => ({
          hash: op.hash,
          type: op.type,
          blockHeight: op.height,
          extra: { assetReference: "ar2", assetOwner: "ow2" },
        }));

        mergeOpsMock.mockImplementation((oldOps, newOps) => [...newOps, ...oldOps]);
        cleanedOperationMock.mockImplementation(operation => operation);
        mergeSubAccountsMock.mockImplementation((oldSubAccounts, newSubAccounts) => [
          ...newSubAccounts,
          ...oldSubAccounts,
        ]);

        buildSubAccountsMock.mockReturnValue([
          { id: `${currency.id}_subAcc1`, type: "TokenAccount" },
        ]);

        inferSubOperationsMock.mockImplementation(hash =>
          hash === "h2" ? [{ id: `${currency.id}_subOp1` }] : [],
        );

        lastBlockMock.mockResolvedValue({ height: 123 });

        const getShape = genericGetAccountShape(network, currency.id);
        const result = await getShape(
          {
            address: `${currency.id}_addr1`,
            initialAccount,
            currency,
            derivationMode: "",
          } as any,
          { paginationConfig: {} as any },
        );

        expect(chainSpecificGetAccountShapeMock).toHaveBeenCalledWith(`${currency.id}_addr1`);

        expect(listOperationsMock).toHaveBeenCalledWith(`${currency.id}_addr1`, {
          minHeight: expectedPagination.minHeight,
          cursor: expectedPagination.cursor,
          order: expectedPagination.order,
        });

        const assetsBalancePassed = buildSubAccountsMock.mock.calls[0][0].allTokenAssetsBalances;
        expect(assetsBalancePassed).toEqual([
          { asset: { symbol: "TOK1", type: "token" }, value: 42n },
          { asset: { symbol: "TOK_IGNORE", type: "token" }, value: 5n },
        ]);

        const assetOpsPassed = buildSubAccountsMock.mock.calls[0][0].operations;
        expect(assetOpsPassed).toEqual([
          {
            blockHeight: 12,
            extra: {
              assetOwner: "ow2",
              assetReference: "ar2",
            },
            hash: "h2",
            type: "OUT",
          },
          {
            blockHeight: 16,
            extra: {
              assetOwner: "ow2",
              assetReference: "ar2",
            },
            hash: "h4",
            type: "IN",
          },
        ]);

        expect(result).toMatchObject({
          balance: new BigNumber(1000),
          spendableBalance: new BigNumber(700),
          blockHeight: 123,
          operationsCount: expectedOperations.length,
          subAccounts: [{ id: `${currency.id}_subAcc1`, type: "TokenAccount" }],
          operations: expectedOperations,
        });
      },
    );

    test("handles empty operations (no old ops, no new ops) and blockHeight=0", async () => {
      getBalanceMock.mockResolvedValue([{ asset: { type: "native" }, value: 0n, locked: 0n }]);
      extractBalanceMock.mockReturnValue({ value: 0n, locked: 0n });
      listOperationsMock.mockResolvedValue({ items: [], next: undefined });
      buildSubAccountsMock.mockReturnValue([]);

      const getShape = genericGetAccountShape(network, currency.id);
      const result = await getShape(
        {
          address: `${currency.id}_addr2`,
          initialAccount: undefined,
          currency,
          derivationMode: "",
        } as any,
        { paginationConfig: {} as any },
      );
      expect(result).toMatchObject({
        operations: [], // Empty array check for `operations`
        blockHeight: 0,
        operationsCount: 0,
        subAccounts: [], // Empty array check for `subAccounts`
        balance: new BigNumber(0),
        spendableBalance: new BigNumber(0),
      });
    });

    test("existing operations object refs are preserved", async () => {
      const oldOps = [
        {
          hash: "h1",
          blockHeight: 10,
          type: "OPT_IN",
          extra: { pagingToken: "pt1", assetReference: "ar1", assetOwner: "ow1" },
          accountId: "accId",
          id: "accId_h1_OPT_IN",
        },
        {
          hash: "h2",
          blockHeight: 12,
          type: "OUT",
          extra: { assetReference: "ar2", assetOwner: "ow2" },
          accountId: "accId",
          id: "accId_h2_OUT",
        },
      ];

      const initialAccount = {
        operations: oldOps,
        pendingOperations: [],
        blockHeight: 10,
        syncHash: "sync-hash",
      };

      const getShape = genericGetAccountShape(network, currency.id);
      const result = await getShape(
        {
          address: `${currency.id}_addr2`,
          initialAccount,
          currency,
          derivationMode: "",
        } as any,
        { paginationConfig: {} as any },
      );

      expect(result.operations?.[0]).toStrictEqual(oldOps[0]);
      expect(result.operations?.[1]).toStrictEqual(oldOps[1]);
    });

    test("LedgerOPTypes is handled correctly", async () => {
      const txWithLedgerOpTypes = {
        hash: "tx-hash3",
        type: "OUT",
        tx: { failed: false },
        details: {
          assetReference: "usdc",
          assetOwner: "owner",
          ledgerOpType: "IN",
          assetSenders: ["other"],
          assetRecipients: ["owner"],
        },
      };

      listOperationsMock.mockResolvedValue({ items: [txWithLedgerOpTypes], next: undefined });

      const getShape = genericGetAccountShape(network, currency.id);
      const result = await getShape(
        {
          address: `${currency.id}_addr2`,
          initialAccount: undefined,
          currency,
          derivationMode: "",
        } as any,
        { paginationConfig: {} as any },
      );

      const operation = result.operations?.[0];
      expect(operation?.hash).toBe(txWithLedgerOpTypes.hash);
      expect(operation?.type).toBe(txWithLedgerOpTypes.type);
    });

    test("internal operations are correctly attached to parent operations with matching hash", async () => {
      const parentOpHash = "parent-hash-123";
      const parentOp = {
        hash: parentOpHash,
        type: "OUT",
        height: 15,
        tx: { failed: false },
      };
      const internalOp = {
        hash: parentOpHash, // Same hash as parent
        type: "IN",
        height: 15,
        tx: { failed: false },
        details: {
          ledgerOpType: "IN",
        },
      };

      getBalanceMock.mockResolvedValue([{ asset: { type: "native" }, value: 1000n, locked: 0n }]);
      extractBalanceMock.mockReturnValue({ value: 1000n, locked: 0n });
      listOperationsMock.mockResolvedValue({ items: [parentOp, internalOp], next: undefined });
      buildSubAccountsMock.mockReturnValue([]);
      lastBlockMock.mockResolvedValue({ height: 123 });

      adaptCoreOperationToLiveOperationMock.mockImplementation((_accId, op) => {
        if (op.hash === parentOpHash && op.type === "IN") {
          // This is the internal operation
          return {
            hash: op.hash,
            type: op.type,
            blockHeight: op.height,
            extra: { internal: true },
          };
        }
        // This is the parent operation
        return {
          hash: op.hash,
          type: op.type,
          blockHeight: op.height,
          extra: {},
        };
      });

      cleanedOperationMock.mockImplementation(operation => operation);
      mergeOpsMock.mockImplementation((_oldOps, newOps) => newOps);
      inferSubOperationsMock.mockReturnValue([]);

      const getShape = genericGetAccountShape(network, currency.id);
      const result = await getShape(
        {
          address: `${currency.id}_addr3`,
          initialAccount: undefined,
          currency,
          derivationMode: "",
        } as any,
        { paginationConfig: {} as any },
      );

      expect(result.operations).toHaveLength(1);
      const operation = result.operations?.[0];
      expect(operation?.hash).toBe(parentOpHash);
      expect(operation?.type).toBe("OUT");
      expect(operation?.internalOperations).toBeDefined();
      expect(operation?.internalOperations).toHaveLength(1);
      const attachedInternalOp = operation?.internalOperations?.[0];
      expect(attachedInternalOp?.hash).toBe(parentOpHash);
      expect(attachedInternalOp?.type).toBe("IN");
      expect((attachedInternalOp as any)?.extra?.internal).toBe(true);
    });
  });
});

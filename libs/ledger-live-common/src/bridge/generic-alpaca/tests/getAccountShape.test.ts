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
          lastPagingToken: "pt1",
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
            extra: {},
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
            extra: {},
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

        listOperationsMock.mockResolvedValue([
          [
            { hash: "h2", type: "OUT", height: 12 },
            { hash: "h2", type: "OUT", height: 12, _token: true },
            { hash: "h3", type: "IN", tx: { failed: true }, height: 14 }, // won't appear in final shape
            { hash: "h4", type: "IN", tx: { failed: false }, height: 16 },
          ],
        ]);
        refreshOperationsMock.mockImplementation(ops => {
          const op = ops[0];
          if (op?.hash === "h0") {
            return [{ ...op, blockHeight: 12 }];
          }
          return [];
        });

        adaptCoreOperationToLiveOperationMock.mockImplementation((_accId, op: any) => {
          const isTokenOp = op._token === true;
          return {
            hash: op.hash,
            type: op.type,
            blockHeight: op.height,
            extra: isTokenOp ? { assetReference: "ar2", assetOwner: "ow2" } : {},
          };
        });

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

        expect(listOperationsMock).toHaveBeenCalledWith(`${currency.id}_addr1`, expectedPagination);

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
      listOperationsMock.mockResolvedValue([[]]);
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

      getBalanceMock.mockResolvedValue([{ asset: { type: "native" }, value: 0n, locked: 0n }]);
      extractBalanceMock.mockReturnValue({ value: 0n, locked: 0n });
      listOperationsMock.mockResolvedValue([[txWithLedgerOpTypes]]);
      buildSubAccountsMock.mockReturnValue([]);
      lastBlockMock.mockResolvedValue({ height: 1 });
      adaptCoreOperationToLiveOperationMock.mockImplementation((_accId, op: any) => ({
        hash: op.hash,
        type: op.type,
        blockHeight: 1,
        extra: {
          assetReference: op.details?.assetReference,
          assetOwner: op.details?.assetOwner,
        },
      }));
      cleanedOperationMock.mockImplementation((o: any) => o);
      mergeOpsMock.mockImplementation((_old: any[], newOps: any[]) => newOps);
      inferSubOperationsMock.mockReturnValue([]);

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
      // Token-only op becomes a synthetic FEES parent (one parent per hash)
      expect(operation?.type).toBe("FEES");
    });

    test("buildOneParentOpPerHash: token-only hash produces one synthetic FEES parent with subOperations", async () => {
      const txHash = "pure-erc20-hash";
      const tokenOpFromList = { hash: txHash, type: "OUT", height: 20, tx: { failed: false } };

      getBalanceMock.mockResolvedValue([{ asset: { type: "native" }, value: 1000n, locked: 0n }]);
      extractBalanceMock.mockReturnValue({ value: 1000n, locked: 0n });
      listOperationsMock.mockResolvedValue([[tokenOpFromList]]);
      lastBlockMock.mockResolvedValue({ height: 100 });

      adaptCoreOperationToLiveOperationMock.mockImplementation((_accId, op) => ({
        hash: op.hash,
        type: op.type,
        blockHeight: op.height,
        blockHash: "0xblock",
        fee: new BigNumber(21000),
        value: new BigNumber("8000000"),
        senders: ["0xabc"],
        recipients: ["0xdef"],
        date: new Date("2024-01-15"),
        extra: { assetReference: "0xusdc", assetOwner: "accId" },
      }));

      buildSubAccountsMock.mockReturnValue([
        {
          id: `${currency.id}_tokenAcc1`,
          type: "TokenAccount",
          operations: [
            {
              hash: txHash,
              type: "OUT",
              accountId: `${currency.id}_tokenAcc1`,
              id: `accId_${txHash}_OUT`,
              value: new BigNumber("8000000"),
              fee: new BigNumber(0),
            },
          ],
        },
      ]);
      inferSubOperationsMock.mockImplementation((hash: string) =>
        hash === txHash
          ? [
              {
                hash: txHash,
                type: "OUT",
                accountId: `${currency.id}_tokenAcc1`,
                id: `accId_${txHash}_OUT`,
                value: new BigNumber("8000000"),
                fee: new BigNumber(0),
              },
            ]
          : [],
      );
      cleanedOperationMock.mockImplementation((op: any) => op);
      mergeOpsMock.mockImplementation((_old: any[], newOps: any[]) => newOps);

      const getShape = genericGetAccountShape(network, currency.id);
      const result = await getShape(
        {
          address: `${currency.id}_addr_pure_token`,
          initialAccount: undefined,
          currency,
          derivationMode: "",
        } as any,
        { paginationConfig: {} as any },
      );

      expect(result.operations).toHaveLength(1);
      const topOp = result.operations?.[0];
      expect(topOp?.hash).toBe(txHash);
      expect(topOp?.type).toBe("FEES");
      expect(topOp?.value?.toFixed()).toBe("21000");
      expect(topOp?.fee?.toFixed()).toBe("21000");
      expect(topOp?.subOperations).toHaveLength(1);
      expect(topOp?.subOperations?.[0]?.type).toBe("OUT");
      expect(topOp?.subOperations?.[0]?.value?.toFixed()).toBe("8000000");
    });

    test("buildOneParentOpPerHash: native op with same hash as token uses native as parent with subOperations", async () => {
      const txHash = "native-and-token-hash";
      const nativeOpFromList = { hash: txHash, type: "OUT", height: 18, tx: { failed: false } };
      const tokenOpFromList = { hash: txHash, type: "OUT", height: 18, tx: { failed: false } };

      getBalanceMock.mockResolvedValue([{ asset: { type: "native" }, value: 1000n, locked: 0n }]);
      extractBalanceMock.mockReturnValue({ value: 1000n, locked: 0n });
      listOperationsMock.mockResolvedValue([[nativeOpFromList, tokenOpFromList]]);
      lastBlockMock.mockResolvedValue({ height: 100 });

      adaptCoreOperationToLiveOperationMock.mockImplementation((_accId, op) => {
        if (op === tokenOpFromList) {
          return {
            hash: op.hash,
            type: op.type,
            blockHeight: op.height,
            blockHash: "0xblock",
            fee: new BigNumber(21000),
            value: new BigNumber("1000000"),
            senders: ["0xabc"],
            recipients: ["0xdef"],
            date: new Date("2024-01-15"),
            extra: { assetReference: "0xusdc", assetOwner: "accId" },
          };
        }
        return {
          hash: op.hash,
          type: op.type,
          blockHeight: op.height,
          blockHash: "0xblock",
          fee: new BigNumber(21000),
          value: new BigNumber(1e18),
          senders: ["0xabc"],
          recipients: ["0xdef"],
          date: new Date("2024-01-15"),
          extra: {},
        };
      });

      buildSubAccountsMock.mockReturnValue([
        {
          id: `${currency.id}_tokenAcc1`,
          type: "TokenAccount",
          operations: [
            {
              hash: txHash,
              type: "OUT",
              accountId: `${currency.id}_tokenAcc1`,
              id: `accId_${txHash}_OUT`,
              value: new BigNumber("1000000"),
              fee: new BigNumber(0),
            },
          ],
        },
      ]);
      inferSubOperationsMock.mockImplementation((hash: string) =>
        hash === txHash
          ? [
              {
                hash: txHash,
                type: "OUT",
                accountId: `${currency.id}_tokenAcc1`,
                id: `accId_${txHash}_OUT`,
                value: new BigNumber("1000000"),
                fee: new BigNumber(0),
              },
            ]
          : [],
      );
      cleanedOperationMock.mockImplementation((op: any) => op);
      mergeOpsMock.mockImplementation((_old: any[], newOps: any[]) => newOps);

      const getShape = genericGetAccountShape(network, currency.id);
      const result = await getShape(
        {
          address: `${currency.id}_addr_native_token`,
          initialAccount: undefined,
          currency,
          derivationMode: "",
        } as any,
        { paginationConfig: {} as any },
      );

      expect(result.operations).toHaveLength(1);
      const topOp = result.operations?.[0];
      expect(topOp?.hash).toBe(txHash);
      expect(topOp?.type).toBe("OUT");
      expect(topOp?.value?.toFixed()).toBe((1e18).toString());
      expect(topOp?.subOperations).toHaveLength(1);
      expect(topOp?.subOperations?.[0]?.value?.toFixed()).toBe("1000000");
    });

    test("internal vs non-internal ops are partitioned and internal attached to correct parent", async () => {
      const parentHash = "parent-h";
      const nativeOp = {
        hash: parentHash,
        type: "OUT",
        height: 10,
        tx: { failed: false },
      };
      const internalOp = {
        hash: parentHash,
        type: "IN",
        height: 10,
        tx: { failed: false },
        details: { ledgerOpType: "IN" },
      };

      getBalanceMock.mockResolvedValue([{ asset: { type: "native" }, value: 1000n, locked: 0n }]);
      extractBalanceMock.mockReturnValue({ value: 1000n, locked: 0n });
      listOperationsMock.mockResolvedValue([[nativeOp, internalOp]]);
      buildSubAccountsMock.mockReturnValue([]);
      lastBlockMock.mockResolvedValue({ height: 100 });

      adaptCoreOperationToLiveOperationMock.mockImplementation((_accId, op: any) => {
        if (op.hash === parentHash && op.type === "IN") {
          return {
            hash: op.hash,
            type: op.type,
            blockHeight: op.height,
            extra: { internal: true },
          };
        }
        return {
          hash: op.hash,
          type: op.type,
          blockHeight: op.height,
          extra: {},
        };
      });

      cleanedOperationMock.mockImplementation((op: any) => op);
      mergeOpsMock.mockImplementation((_old: any[], newOps: any[]) => newOps);
      inferSubOperationsMock.mockReturnValue([]);

      const getShape = genericGetAccountShape(network, currency.id);
      const result = await getShape(
        {
          address: `${currency.id}_addr_partition`,
          initialAccount: undefined,
          currency,
          derivationMode: "",
        } as any,
        { paginationConfig: {} as any },
      );

      expect(result.operations).toHaveLength(1);
      expect(result.operations?.[0]?.internalOperations).toHaveLength(1);
      expect(result.operations?.[0]?.internalOperations?.[0]?.extra?.internal).toBe(true);
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
      listOperationsMock.mockResolvedValue([[parentOp, internalOp]]);
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

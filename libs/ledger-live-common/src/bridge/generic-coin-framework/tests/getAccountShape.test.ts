import BigNumber from "bignumber.js";
import { genericGetAccountShape } from "../getAccountShape";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";

const getSyncHashMock = jest.fn();
jest.mock("@ledgerhq/ledger-wallet-framework/account/index", () => ({
  encodeAccountId: jest.fn(() => "accId"),
  getSyncHash: (...args: any[]) => getSyncHashMock(...args),
}));

const mergeOpsMock = jest.fn();
jest.mock("@ledgerhq/ledger-wallet-framework/bridge/jsHelpers", () => ({
  mergeOps: (...args: any[]) => mergeOpsMock(...args),
}));

const listOperationsMock = jest.fn();
const getBalanceMock = jest.fn();
const lastBlockMock = jest.fn();
const getTokenFromAssetMock = jest.fn();
const chainSpecificGetAccountShapeMock = jest.fn();
const refreshOperationsMock = jest.fn();
jest.mock("../api", () => ({
  getCoinModuleApi: () => ({
    lastBlock: (...a: any[]) => lastBlockMock(...a),
    getBalance: (...a: any[]) => getBalanceMock(...a),
    listOperations: (...a: any[]) => listOperationsMock(...a),
    refreshOperations: (...a: any[]) => refreshOperationsMock(...a),
  }),
}));
const getBridgeApiMock = jest.fn();
jest.mock("../bridge", () => ({
  getBridgeApi: (...a: any[]) => getBridgeApiMock(...a),
}));
const defaultBridgeApi = () => ({
  getTokenFromAsset: getTokenFromAssetMock,
  getChainSpecificRules: {
    getAccountShape: (...a: any[]) => chainSpecificGetAccountShapeMock(...a),
  },
});
getBridgeApiMock.mockImplementation(defaultBridgeApi);

const adaptCoreOperationToLiveOperationMock = jest.fn();
const extractBalanceMock = jest.fn();
const cleanedOperationMock = jest.fn();
jest.mock("../utils", () => ({
  adaptCoreOperationToLiveOperation: (...a: any[]) => adaptCoreOperationToLiveOperationMock(...a),
  extractBalance: (...a: any[]) => extractBalanceMock(...a),
  cleanedOperation: (...a: any[]) => cleanedOperationMock(...a),
}));

const inferSubOperationsMock = jest.fn();
jest.mock("@ledgerhq/ledger-wallet-framework/serialization", () => ({
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

setupMockCryptoAssetsStore();

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

        listOperationsMock.mockResolvedValue({
          items: [
            { hash: "h2", type: "OUT", height: 12 },
            { hash: "h2", type: "OUT", height: 12, _token: true },
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

        expect(listOperationsMock).toHaveBeenCalledWith(`${currency.id}_addr1`, {
          minHeight: expectedPagination.minHeight,
          order: expectedPagination.order,
          ...("cursor" in expectedPagination ? { cursor: expectedPagination.cursor } : {}),
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

    test("does not double count native balance when staking metadata is attached to it", async () => {
      const nativeBalance = {
        asset: { type: "native" },
        value: 1000n,
        locked: 300n,
        stake: {
          state: "active",
          delegate: "validator-1",
          amount: 1000n,
          amountRewarded: 25n,
        },
      };

      getBalanceMock.mockResolvedValue([nativeBalance]);
      extractBalanceMock.mockReturnValue(nativeBalance);
      listOperationsMock.mockResolvedValue({ items: [], next: undefined });
      buildSubAccountsMock.mockReturnValue([]);

      const getShape = genericGetAccountShape(network, currency.id);
      const result = await getShape(
        {
          address: `${currency.id}_addr_native_stake`,
          initialAccount: undefined,
          currency,
          derivationMode: "",
        } as any,
        { paginationConfig: {} },
      );

      expect(result.balance).toEqual(new BigNumber("1000"));
      expect(result.spendableBalance).toEqual(new BigNumber("700"));
      expect((result as any).stakingResources).toMatchObject({
        delegatedBalance: new BigNumber("1000"),
        pendingRewardsBalance: new BigNumber("25"),
        delegations: [
          {
            validatorAddress: "validator-1",
            amount: new BigNumber("1000"),
            pendingRewards: new BigNumber("25"),
            status: "bonded",
          },
        ],
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
      listOperationsMock.mockResolvedValue({ items: [txWithLedgerOpTypes], next: undefined });
      buildSubAccountsMock.mockReturnValue([]);
      lastBlockMock.mockResolvedValue({ height: 1 });
      adaptCoreOperationToLiveOperationMock.mockImplementation((_accId, op: any) => ({
        hash: op.hash,
        type: op.type,
        blockHeight: 1,
        extra: {
          assetReference: op.details?.assetReference,
          assetOwner: op.details?.assetOwner,
          feePayer: `${currency.id}_addr2`,
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
      listOperationsMock.mockResolvedValue({ items: [tokenOpFromList] });
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
        extra: {
          assetReference: "0xusdc",
          assetOwner: "accId",
          feePayer: `${currency.id}_addr_pure_token`,
        },
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
      listOperationsMock.mockResolvedValue({ items: [nativeOpFromList, tokenOpFromList] });
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

    test("buildOneParentOpPerHash: self-send (same hash IN + OUT) emits 2 parent operations", async () => {
      const txHash = "self-send-hash";
      const inOpFromList = { hash: txHash, type: "IN", height: 20, tx: { failed: false } };
      const outOpFromList = { hash: txHash, type: "OUT", height: 20, tx: { failed: false } };

      getBalanceMock.mockResolvedValue([{ asset: { type: "native" }, value: 1000n, locked: 0n }]);
      extractBalanceMock.mockReturnValue({ value: 1000n, locked: 0n });
      listOperationsMock.mockResolvedValue({ items: [inOpFromList, outOpFromList] });
      lastBlockMock.mockResolvedValue({ height: 100 });

      adaptCoreOperationToLiveOperationMock.mockImplementation((_accId, op: any) => {
        return {
          hash: op.hash,
          type: op.type,
          blockHeight: op.height,
          blockHash: "0xblock",
          fee: new BigNumber(21000),
          value: new BigNumber("1"),
          senders: ["0xabc"],
          recipients: ["0xabc"],
          date: new Date("2024-01-15"),
          extra: {},
        };
      });

      buildSubAccountsMock.mockReturnValue([]);
      inferSubOperationsMock.mockReturnValue([]);
      cleanedOperationMock.mockImplementation((op: any) => op);
      mergeOpsMock.mockImplementation((_old: any[], newOps: any[]) => newOps);

      const getShape = genericGetAccountShape(network, currency.id);
      const result = await getShape(
        {
          address: `${currency.id}_addr_self_send`,
          initialAccount: undefined,
          currency,
          derivationMode: "",
        } as any,
        { paginationConfig: {} as any },
      );

      expect(result.operations).toHaveLength(2);
      const types = result.operations?.map(o => o.type) ?? [];
      expect(types).toContain("IN");
      expect(types).toContain("OUT");
      expect(result.operations?.[0]?.hash).toBe(txHash);
      expect(result.operations?.[1]?.hash).toBe(txHash);
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
      listOperationsMock.mockResolvedValue({ items: [nativeOp, internalOp] });
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
      expect(result.operations?.[0]?.internalOperations?.[0]?.extra).toHaveProperty(
        "internal",
        true,
      );
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

  describe("evm", () => {
    const network = "mainnet";
    const currency = { id: "evm", name: "EVM" };
    const txHash = "0xspec";

    const realAdaptCoreOp = (
      jest.requireActual("../utils") as {
        adaptCoreOperationToLiveOperation: (a: string, o: unknown) => unknown;
      }
    ).adaptCoreOperationToLiveOperation;

    function toCoreOp(op: {
      type: string;
      senders: string[];
      recipients: string[];
      value: number | string;
      fee: number | string;
      asset?: { type: "native" } | { type: string; assetReference?: string; assetOwner?: string };
      feesPayer?: string;
      internal?: boolean;
    }) {
      const details =
        op.asset?.type !== "native" && op.asset && "assetReference" in op.asset
          ? {
              assetAmount: String(op.value),
              ledgerOpType: op.type,
              assetSenders: op.senders,
              assetRecipients: op.recipients,
              ...(op.internal ? { internal: true } : {}),
            }
          : op.internal
            ? { internal: true }
            : undefined;
      return {
        type: op.type,
        senders: op.senders,
        recipients: op.recipients,
        value: BigInt(op.value),
        asset: op.asset ?? { type: "native" },
        tx: {
          hash: txHash,
          fees: BigInt(op.fee),
          feesPayer: op.feesPayer,
          failed: false,
          block: { hash: "0xblock", height: 100 },
          date: new Date("2025-02-20"),
        },
        ...(details ? { details } : {}),
      };
    }

    function setupSpecTest() {
      getSyncHashMock.mockReturnValue("sync-hash");
      getBalanceMock.mockResolvedValue([{ asset: { type: "native" }, value: 0n, locked: 0n }]);
      extractBalanceMock.mockReturnValue({ value: 0n, locked: 0n });
      lastBlockMock.mockResolvedValue({ height: 100 });
      mergeOpsMock.mockImplementation((_old: any[], newOps: any[]) => newOps);
      cleanedOperationMock.mockImplementation((op: any) => op);
      mergeSubAccountsMock.mockImplementation((_old: any[], newSub: any[]) => newSub);
      chainSpecificGetAccountShapeMock.mockImplementation(() => {});
      adaptCoreOperationToLiveOperationMock.mockImplementation(
        realAdaptCoreOp as typeof adaptCoreOperationToLiveOperationMock,
      );
    }

    function createGetShape() {
      return genericGetAccountShape(network, currency.id);
    }

    async function runGetShape(address: string) {
      const getShape = createGetShape();
      return getShape({ address, initialAccount: undefined, currency, derivationMode: "" } as any, {
        paginationConfig: {} as any,
      });
    }

    function mockNoSubAccounts() {
      buildSubAccountsMock.mockReturnValue([]);
    }

    function mockNoInferSubOps() {
      inferSubOperationsMock.mockReturnValue([]);
    }

    function mockInferSubOpsByHash() {
      inferSubOperationsMock.mockImplementation((hash: string, subAccounts: any[]) =>
        (subAccounts?.[0]?.operations ?? []).filter((o: any) => o.hash === hash),
      );
    }

    function mockErc20SubAccounts(
      contractAddress: string,
      opMap?: (ops: any[], owner: string) => any[],
    ) {
      buildSubAccountsMock.mockImplementation((_ctx: any) => {
        const ops = _ctx.operations as any[];
        if (!ops?.length) return [];
        const owner = ops[0].extra?.assetOwner ?? "";
        const tokenAccId = `accId_${owner}_${contractAddress}`;
        const defaultOps = ops.map((o: any) => ({
          ...o,
          accountId: tokenAccId,
          value: new BigNumber(o.value?.toString() ?? o.extra?.assetAmount ?? 0),
          type: o.extra?.ledgerOpType ?? o.type,
        }));
        return [
          {
            id: tokenAccId,
            type: "TokenAccount",
            parentId: "accId",
            token: { contractAddress },
            operations: opMap ? opMap(ops, owner) : defaultOps,
          } as any,
        ];
      });
    }

    test("balance reflects only available native; delegated tracked in stakingResources", async () => {
      getSyncHashMock.mockReturnValue("sync-hash");
      // extractBalance returns the primary native row (available only)
      extractBalanceMock.mockReturnValue({ value: 100n, locked: 0n });
      getBalanceMock.mockResolvedValue([
        { asset: { type: "native" }, value: 100n },
        {
          // value (75n) intentionally differs from stake.amount (50n) to verify
          // that delegatedAmountForStakingResources uses stake.amount, not b.value
          asset: { type: "native" },
          value: 75n,
          stake: {
            uid: "s1",
            address: "0xabc",
            delegate: "0xvalidator",
            state: "active",
            asset: { type: "native" },
            amount: 50n,
          },
        },
      ]);
      listOperationsMock.mockResolvedValue({ items: [], next: undefined });
      buildSubAccountsMock.mockReturnValue([]);
      inferSubOperationsMock.mockReturnValue([]);
      lastBlockMock.mockResolvedValue({ height: 1 });
      mergeOpsMock.mockImplementation((_old: unknown[], newOps: unknown[]) => newOps);
      cleanedOperationMock.mockImplementation((op: unknown) => op);
      chainSpecificGetAccountShapeMock.mockImplementation(() => {});

      const getShape = genericGetAccountShape("mainnet", "celo");
      const result = await getShape(
        {
          address: "0xtest",
          initialAccount: undefined,
          currency: { id: "celo", name: "Celo", family: "evm" },
          derivationMode: "",
        } as any,
        { paginationConfig: {} as any },
      );

      // balance = available native only (not 100 + 75); staked lives in stakingResources
      expect(result.balance).toEqual(new BigNumber(100));
      expect(result.spendableBalance).toEqual(new BigNumber(100));
      // delegatedBalance and delegation.amount must use stake.amount (50), not b.value (75)
      expect((result as any).stakingResources?.delegatedBalance).toEqual(new BigNumber(50));
      expect((result as any).stakingResources?.delegations[0]?.amount).toEqual(new BigNumber(50));
    });

    test("does not double count when stake metadata is on primary native row", async () => {
      getSyncHashMock.mockReturnValue("sync-hash");
      // extractBalance returns the single native row (value: 100n)
      extractBalanceMock.mockReturnValue({ value: 100n, locked: 0n });
      getBalanceMock.mockResolvedValue([
        {
          // stake.amount (80n) differs from value (100n) — delegatedAmountForStakingResources
          // must use stake.amount, and the account balance must NOT double-count
          asset: { type: "native" },
          value: 100n,
          stake: {
            uid: "s1",
            address: "tz1abc",
            delegate: "tz1validator",
            state: "active",
            asset: { type: "native" },
            amount: 80n,
          },
        },
      ]);
      listOperationsMock.mockResolvedValue({ items: [], next: undefined });
      buildSubAccountsMock.mockReturnValue([]);
      inferSubOperationsMock.mockReturnValue([]);
      lastBlockMock.mockResolvedValue({ height: 1 });
      mergeOpsMock.mockImplementation((_old: unknown[], newOps: unknown[]) => newOps);
      cleanedOperationMock.mockImplementation((op: unknown) => op);
      chainSpecificGetAccountShapeMock.mockImplementation(() => {});

      const getShape = genericGetAccountShape("mainnet", "tezos");
      const result = await getShape(
        {
          address: "tz1test",
          initialAccount: undefined,
          currency: { id: "tezos", name: "Tezos", family: "tezos" },
          derivationMode: "",
        } as any,
        { paginationConfig: {} as any },
      );

      // balance = available native only; stake.amount does not inflate it
      expect(result.balance).toEqual(new BigNumber(100));
      expect(result.spendableBalance).toEqual(new BigNumber(100));
      // delegatedBalance and delegation.amount use stake.amount (80), not b.value (100)
      expect((result as any).stakingResources?.delegatedBalance).toEqual(new BigNumber(80));
      expect((result as any).stakingResources?.delegations[0]?.amount).toEqual(new BigNumber(80));
    });

    test("maps an activating stake to a delegation with status 'activating'", async () => {
      getSyncHashMock.mockReturnValue("sync-hash");
      extractBalanceMock.mockReturnValue({ value: 100n, locked: 0n });
      getBalanceMock.mockResolvedValue([
        { asset: { type: "native" }, value: 100n },
        {
          asset: { type: "native" },
          value: 75n,
          stake: {
            uid: "s1",
            address: "0xabc",
            delegate: "0xvalidator",
            state: "activating",
            asset: { type: "native" },
            amount: 75n,
          },
        },
      ]);
      listOperationsMock.mockResolvedValue({ items: [], next: undefined });
      buildSubAccountsMock.mockReturnValue([]);
      inferSubOperationsMock.mockReturnValue([]);
      lastBlockMock.mockResolvedValue({ height: 1 });
      mergeOpsMock.mockImplementation((_old: unknown[], newOps: unknown[]) => newOps);
      cleanedOperationMock.mockImplementation((op: unknown) => op);
      chainSpecificGetAccountShapeMock.mockImplementation(() => {});

      const getShape = genericGetAccountShape("mainnet", "monad");
      const result = await getShape(
        {
          address: "0xtest",
          initialAccount: undefined,
          currency: { id: "monad", name: "Monad", family: "evm" },
          derivationMode: "",
        } as any,
        { paginationConfig: {} as any },
      );

      expect((result as any).stakingResources?.delegations).toStrictEqual([
        expect.objectContaining({
          validatorAddress: "0xvalidator",
          amount: new BigNumber(75),
          status: "activating",
        }),
      ]);
    });

    test("usesStakingPositions: surfaces raw Stake[] preserving uid prefixes; no stakingResources", async () => {
      getSyncHashMock.mockReturnValue("sync-hash");
      extractBalanceMock.mockReturnValue({ value: 1000n, locked: 0n });
      // Three balance rows mirroring buildStakesForAccount output: delegation-* / stake-* / unstaking-*
      const stakes = [
        {
          uid: "delegation-tz1abc",
          address: "tz1abc",
          delegate: "tz1baker",
          state: "active" as const,
          asset: { type: "native" as const },
          amount: 700n,
        },
        {
          uid: "stake-tz1abc",
          address: "tz1abc",
          delegate: "tz1baker",
          state: "active" as const,
          asset: { type: "native" as const },
          amount: 300n,
        },
        {
          uid: "unstaking-tz1abc",
          address: "tz1abc",
          delegate: "tz1baker",
          state: "deactivating" as const,
          asset: { type: "native" as const },
          amount: 50n,
        },
      ];
      getBalanceMock.mockResolvedValue([
        { asset: { type: "native" }, value: 1000n },
        ...stakes.map(stake => ({ asset: { type: "native" }, value: stake.amount, stake })),
      ]);
      listOperationsMock.mockResolvedValue({ items: [], next: undefined });
      buildSubAccountsMock.mockReturnValue([]);
      inferSubOperationsMock.mockReturnValue([]);
      lastBlockMock.mockResolvedValue({ height: 1 });
      mergeOpsMock.mockImplementation((_old: unknown[], newOps: unknown[]) => newOps);
      cleanedOperationMock.mockImplementation((op: unknown) => op);
      chainSpecificGetAccountShapeMock.mockImplementation(() => {});

      // Override the bridge mock to opt into the stakingPositions shape (Tezos config)
      getBridgeApiMock.mockImplementationOnce(() => ({
        ...defaultBridgeApi(),
        usesStakingPositions: true,
      }));

      const getShape = genericGetAccountShape("mainnet", "tezos");
      const result = await getShape(
        {
          address: "tz1abc",
          initialAccount: undefined,
          currency: { id: "tezos", name: "Tezos", family: "tezos" },
          derivationMode: "",
        } as any,
        { paginationConfig: {} as any },
      );

      const positions = (result as any).stakingPositions;
      expect(positions).toHaveLength(3);
      expect(positions.map((p: any) => p.uid)).toEqual([
        "delegation-tz1abc",
        "stake-tz1abc",
        "unstaking-tz1abc",
      ]);
      // bigint framework amounts converted to BigNumber to match Account-side convention
      expect(positions[0].amount).toEqual(new BigNumber(700));
      expect(positions[1].amount).toEqual(new BigNumber(300));
      expect(positions[2].amount).toEqual(new BigNumber(50));
      // Tezos opts out of the EVM-shaped aggregate
      expect((result as any).stakingResources).toBeUndefined();
    });

    test("usesStakingPositions: empty stakes => empty stakingPositions, no stakingResources", async () => {
      // Account has never delegated/staked: balanceRes carries only the primary native row.
      getSyncHashMock.mockReturnValue("sync-hash");
      extractBalanceMock.mockReturnValue({ value: 1000n, locked: 0n });
      getBalanceMock.mockResolvedValue([{ asset: { type: "native" }, value: 1000n }]);
      listOperationsMock.mockResolvedValue({ items: [], next: undefined });
      buildSubAccountsMock.mockReturnValue([]);
      inferSubOperationsMock.mockReturnValue([]);
      lastBlockMock.mockResolvedValue({ height: 1 });
      mergeOpsMock.mockImplementation((_old: unknown[], newOps: unknown[]) => newOps);
      cleanedOperationMock.mockImplementation((op: unknown) => op);
      chainSpecificGetAccountShapeMock.mockImplementation(() => {});

      getBridgeApiMock.mockImplementationOnce(() => ({
        ...defaultBridgeApi(),
        usesStakingPositions: true,
      }));

      const getShape = genericGetAccountShape("mainnet", "tezos");
      const result = await getShape(
        {
          address: "tz1empty",
          initialAccount: undefined,
          currency: { id: "tezos", name: "Tezos", family: "tezos" },
          derivationMode: "",
        } as any,
        { paginationConfig: {} as any },
      );

      // Field is always emitted (the synced TezosAccount type requires it), even when empty
      expect((result as any).stakingPositions).toEqual([]);
      expect((result as any).stakingResources).toBeUndefined();
    });

    test("usesStakingPositions: preserves the available subset when only some kinds are present", async () => {
      // Account has delegated but never opted into staking: only `delegation-*` is present.
      // The `stake-*` and `unstaking-*` prefixes are absent and must NOT be synthesized.
      getSyncHashMock.mockReturnValue("sync-hash");
      extractBalanceMock.mockReturnValue({ value: 1000n, locked: 0n });
      const delegation = {
        uid: "delegation-tz1abc",
        address: "tz1abc",
        delegate: "tz1baker",
        state: "active" as const,
        asset: { type: "native" as const },
        amount: 1000n,
      };
      getBalanceMock.mockResolvedValue([
        { asset: { type: "native" }, value: 1000n },
        { asset: { type: "native" }, value: delegation.amount, stake: delegation },
      ]);
      listOperationsMock.mockResolvedValue({ items: [], next: undefined });
      buildSubAccountsMock.mockReturnValue([]);
      inferSubOperationsMock.mockReturnValue([]);
      lastBlockMock.mockResolvedValue({ height: 1 });
      mergeOpsMock.mockImplementation((_old: unknown[], newOps: unknown[]) => newOps);
      cleanedOperationMock.mockImplementation((op: unknown) => op);
      chainSpecificGetAccountShapeMock.mockImplementation(() => {});

      getBridgeApiMock.mockImplementationOnce(() => ({
        ...defaultBridgeApi(),
        usesStakingPositions: true,
      }));

      const getShape = genericGetAccountShape("mainnet", "tezos");
      const result = await getShape(
        {
          address: "tz1abc",
          initialAccount: undefined,
          currency: { id: "tezos", name: "Tezos", family: "tezos" },
          derivationMode: "",
        } as any,
        { paginationConfig: {} as any },
      );

      const positions = (result as any).stakingPositions;
      expect(positions).toHaveLength(1);
      expect(positions[0].uid).toBe("delegation-tz1abc");
      expect(positions[0].amount).toEqual(new BigNumber(1000));
      expect((result as any).stakingResources).toBeUndefined();
    });

    test("usesStakingPositions: passes through stakes without `delegate` (e.g. unstake after redelegate)", async () => {
      // Per buildStakesForAccount: `stake-*` and `unstaking-*` only carry `delegate` when
      // `delegateAddress` is currently set; the field is omitted otherwise. Verify the
      // pass-through preserves that omission rather than synthesizing it.
      getSyncHashMock.mockReturnValue("sync-hash");
      extractBalanceMock.mockReturnValue({ value: 1000n, locked: 0n });
      const unstaking = {
        uid: "unstaking-tz1abc",
        address: "tz1abc",
        // no delegate
        state: "deactivating" as const,
        asset: { type: "native" as const },
        amount: 50n,
      };
      getBalanceMock.mockResolvedValue([
        { asset: { type: "native" }, value: 1000n },
        { asset: { type: "native" }, value: unstaking.amount, stake: unstaking },
      ]);
      listOperationsMock.mockResolvedValue({ items: [], next: undefined });
      buildSubAccountsMock.mockReturnValue([]);
      inferSubOperationsMock.mockReturnValue([]);
      lastBlockMock.mockResolvedValue({ height: 1 });
      mergeOpsMock.mockImplementation((_old: unknown[], newOps: unknown[]) => newOps);
      cleanedOperationMock.mockImplementation((op: unknown) => op);
      chainSpecificGetAccountShapeMock.mockImplementation(() => {});

      getBridgeApiMock.mockImplementationOnce(() => ({
        ...defaultBridgeApi(),
        usesStakingPositions: true,
      }));

      const getShape = genericGetAccountShape("mainnet", "tezos");
      const result = await getShape(
        {
          address: "tz1abc",
          initialAccount: undefined,
          currency: { id: "tezos", name: "Tezos", family: "tezos" },
          derivationMode: "",
        } as any,
        { paginationConfig: {} as any },
      );

      const positions = (result as any).stakingPositions;
      expect(positions).toHaveLength(1);
      expect(positions[0]).not.toHaveProperty("delegate");
      expect(positions[0].uid).toBe("unstaking-tz1abc");
    });

    test("Case 1: simple native transfer between EOAs", async () => {
      setupSpecTest();
      const operationsAddress1 = toCoreOp({
        type: "OUT",
        senders: ["address1"],
        recipients: ["address2"],
        value: 2,
        fee: 1,
        feesPayer: "address1",
      });
      const operationsAddress2 = toCoreOp({
        type: "IN",
        senders: ["address1"],
        recipients: ["address2"],
        value: 2,
        fee: 1,
        feesPayer: "address1",
      });
      listOperationsMock.mockImplementation((addr: string) => {
        const items = addr === "address1" ? [operationsAddress1] : [operationsAddress2];
        return Promise.resolve({ items, next: undefined });
      });
      mockNoSubAccounts();
      mockNoInferSubOps();

      const result1 = await runGetShape("address1");
      expect(result1).toMatchObject({
        operations: [
          {
            type: "OUT",
            senders: ["address1"],
            recipients: ["address2"],
            value: new BigNumber(3),
            fee: new BigNumber(1),
          },
        ],
      });

      const result2 = await runGetShape("address2");
      expect(result2).toMatchObject({
        operations: [
          {
            type: "IN",
            senders: ["address1"],
            recipients: ["address2"],
            value: new BigNumber(2),
            fee: new BigNumber(1),
          },
        ],
      });
    });

    test("Case 2: native self send from EOA", async () => {
      setupSpecTest();
      // CoinModuleApi returns 2 ops (OUT, IN) for self-sends per spec. getAccountShape uses them as-is.
      const outOp = toCoreOp({
        type: "OUT",
        senders: ["address1"],
        recipients: ["address1"],
        value: 2,
        fee: 1,
        feesPayer: "address1",
      });
      const inOp = toCoreOp({
        type: "IN",
        senders: ["address1"],
        recipients: ["address1"],
        value: 2,
        fee: 1,
        feesPayer: "address1",
      });
      listOperationsMock.mockResolvedValue({ items: [outOp, inOp], next: undefined });
      mockNoSubAccounts();
      mockNoInferSubOps();

      const result = await runGetShape("address1");
      expect(result.operations).toHaveLength(2);
      const out = result.operations?.find(o => o.type === "OUT");
      const in_ = result.operations?.find(o => o.type === "IN");
      expect(out).toMatchObject({
        type: "OUT",
        senders: ["address1"],
        recipients: ["address1"],
        value: new BigNumber(3),
        fee: new BigNumber(1),
      });
      expect(in_).toMatchObject({
        type: "IN",
        senders: ["address1"],
        recipients: ["address1"],
        value: new BigNumber(2),
        fee: new BigNumber(1),
      });
    });

    test("Case 3: simple ERC20 transfer between EOAs", async () => {
      setupSpecTest();
      const usdtContract = "0xUSDTContract";
      const operationsAddr1 = toCoreOp({
        type: "OUT",
        senders: ["address1"],
        recipients: ["address2"],
        value: 2,
        fee: 1,
        feesPayer: "address1",
        asset: { type: "erc20", assetReference: usdtContract, assetOwner: "address1" },
      });
      const operationsAddr2 = toCoreOp({
        type: "IN",
        senders: ["address1"],
        recipients: ["address2"],
        value: 2,
        fee: 1,
        feesPayer: "address1",
        asset: { type: "erc20", assetReference: usdtContract, assetOwner: "address2" },
      });
      listOperationsMock.mockImplementation((addr: string) => {
        const items = addr === "address1" ? [operationsAddr1] : [operationsAddr2];
        return Promise.resolve({ items, next: undefined });
      });
      mockErc20SubAccounts(usdtContract);
      mockInferSubOpsByHash();

      const result1 = await runGetShape("address1");
      expect(result1).toMatchObject({
        operations: [
          {
            type: "FEES",
            value: new BigNumber(1),
            senders: ["address1"],
            recipients: [usdtContract],
          },
        ],
        subAccounts: [
          {
            operations: [
              {
                type: "OUT",
                senders: ["address1"],
                recipients: ["address2"],
                value: new BigNumber(2),
              },
            ],
          },
        ],
      });

      const result2 = await runGetShape("address2");
      expect(result2).toMatchObject({
        operations: [
          {
            type: "NONE",
            senders: ["address1"],
            recipients: [usdtContract],
            value: new BigNumber(0),
            fee: new BigNumber(1),
          },
        ],
        subAccounts: [
          {
            operations: [
              {
                type: "IN",
                senders: ["address1"],
                recipients: ["address2"],
                value: new BigNumber(2),
              },
            ],
          },
        ],
      });
    });

    test("Case 4: ERC20 self send from EOA", async () => {
      setupSpecTest();
      const usdtContract = "0xUSDTContract";
      // CoinModuleApi returns 2 ops (OUT, IN) for self-sends per spec.
      const outOp = toCoreOp({
        type: "OUT",
        senders: ["address1"],
        recipients: ["address1"],
        value: 2,
        fee: 1,
        feesPayer: "address1",
        asset: { type: "erc20", assetReference: usdtContract, assetOwner: "address1" },
      });
      const inOp = toCoreOp({
        type: "IN",
        senders: ["address1"],
        recipients: ["address1"],
        value: 2,
        fee: 1,
        feesPayer: "address1",
        asset: { type: "erc20", assetReference: usdtContract, assetOwner: "address1" },
      });
      listOperationsMock.mockResolvedValue({ items: [outOp, inOp], next: undefined });
      mockErc20SubAccounts(usdtContract);
      mockInferSubOpsByHash();

      const result = await runGetShape("address1");
      expect(result.operations).toHaveLength(1);
      expect(result.operations?.[0]).toMatchObject({ type: "FEES", value: new BigNumber(1) });
      expect(result.subAccounts).toHaveLength(1);
      expect(result.subAccounts?.[0].operations).toHaveLength(2);
      const outSub = result.subAccounts?.[0].operations?.find(
        (o: { type: string }) => o.type === "OUT",
      );
      const inSub = result.subAccounts?.[0].operations?.find(
        (o: { type: string }) => o.type === "IN",
      );
      expect(outSub?.value?.toFixed()).toBe("2");
      expect(inSub?.value?.toFixed()).toBe("2");
    });

    test("Case 5: ETH transfer from smart contract", async () => {
      setupSpecTest();
      const operationsAddr1 = toCoreOp({
        type: "OUT",
        senders: ["address1"],
        recipients: ["contract1"],
        value: 0,
        fee: 1,
        feesPayer: "address1",
      });
      const operationsAddr2Internal = toCoreOp({
        type: "IN",
        senders: ["contract1"],
        recipients: ["address2"],
        value: 2,
        fee: 1,
        feesPayer: "address1",
        internal: true,
      });
      listOperationsMock.mockImplementation((addr: string) => {
        const items = addr === "address1" ? [operationsAddr1] : [operationsAddr2Internal];
        return Promise.resolve({ items, next: undefined });
      });
      mockNoSubAccounts();
      mockNoInferSubOps();

      const result1 = await runGetShape("address1");
      expect(result1).toMatchObject({
        operations: [
          {
            type: "FEES",
            senders: ["address1"],
            recipients: ["contract1"],
            value: new BigNumber(1),
            fee: new BigNumber(1),
          },
        ],
      });

      const result2 = await runGetShape("address2");
      expect(result2.operations).toHaveLength(1);
      expect(result2).toMatchObject({
        operations: [
          expect.objectContaining({
            type: "NONE",
            senders: ["address1"],
            recipients: ["contract1"],
            value: new BigNumber(0),
            fee: new BigNumber(1),
            internalOperations: [
              expect.objectContaining({
                type: "IN",
                senders: ["contract1"],
                recipients: ["address2"],
                value: new BigNumber(2),
                fee: new BigNumber(1),
              }),
            ],
          }),
        ],
      });
    });

    test("Case 6: ERC20 transfer from smart contract", async () => {
      setupSpecTest();
      const usdtContract = "0xUSDTContract";
      listOperationsMock.mockImplementation((addr: string) => {
        let items: ReturnType<typeof toCoreOp>[];
        switch (addr) {
          case "address1":
            items = [
              toCoreOp({
                type: "OUT",
                senders: ["address1"],
                recipients: ["contract1"],
                value: 0,
                fee: 1,
                feesPayer: "address1",
              }),
            ];
            break;
          case "address2":
            items = [
              toCoreOp({
                type: "IN",
                senders: ["address3"],
                recipients: ["address2"],
                value: 2,
                fee: 1,
                feesPayer: "address1",
                asset: { type: "erc20", assetReference: usdtContract, assetOwner: "address2" },
              }),
            ];
            break;
          default:
            items = [
              toCoreOp({
                type: "OUT",
                senders: ["address3"],
                recipients: ["address2"],
                value: 2,
                fee: 1,
                feesPayer: "address1",
                asset: { type: "erc20", assetReference: usdtContract, assetOwner: "address3" },
              }),
            ];
        }
        return Promise.resolve({ items, next: undefined });
      });
      mockErc20SubAccounts(usdtContract);
      mockInferSubOpsByHash();

      const result1 = await runGetShape("address1");
      expect(result1).toMatchObject({
        operations: [
          {
            type: "FEES",
            value: new BigNumber(1),
            senders: ["address1"],
            recipients: ["contract1"],
          },
        ],
      });

      const result2 = await runGetShape("address2");
      expect(result2).toMatchObject({
        operations: [
          {
            type: "NONE",
            senders: ["address3"],
            recipients: [usdtContract],
            value: new BigNumber(0),
            fee: new BigNumber(1),
          },
        ],
        subAccounts: [
          {
            operations: [
              {
                type: "IN",
                senders: ["address3"],
                recipients: ["address2"],
                value: new BigNumber(2),
              },
            ],
          },
        ],
      });

      const result3 = await runGetShape("address3");
      expect(result3).toMatchObject({
        operations: [
          {
            type: "NONE",
            senders: ["address3"],
            recipients: [usdtContract],
            value: new BigNumber(0),
            fee: new BigNumber(1),
          },
        ],
        subAccounts: [
          {
            operations: [
              {
                type: "OUT",
                senders: ["address3"],
                recipients: ["address2"],
                value: new BigNumber(2),
              },
            ],
          },
        ],
      });
    });

    test("Case 7: ETH transfer to smart contract", async () => {
      setupSpecTest();
      listOperationsMock.mockResolvedValue({
        items: [
          toCoreOp({
            type: "OUT",
            senders: ["address1"],
            recipients: ["contract1"],
            value: 2,
            fee: 1,
            feesPayer: "address1",
          }),
        ],
        next: undefined,
      });
      mockNoSubAccounts();
      mockNoInferSubOps();

      const result = await runGetShape("address1");
      expect(result).toMatchObject({
        operations: [
          {
            type: "OUT",
            senders: ["address1"],
            recipients: ["contract1"],
            value: new BigNumber(3),
            fee: new BigNumber(1),
          },
        ],
      });
    });

    test("Case 8: ERC20 transfer to smart contract", async () => {
      setupSpecTest();
      const usdtContract = "0xUSDTContract";
      listOperationsMock.mockResolvedValue({
        items: [
          toCoreOp({
            type: "OUT",
            senders: ["address1"],
            recipients: ["contract1"],
            value: 2,
            fee: 1,
            feesPayer: "address1",
            asset: { type: "erc20", assetReference: usdtContract, assetOwner: "address1" },
          }),
        ],
        next: undefined,
      });
      mockErc20SubAccounts(usdtContract, (ops, owner) =>
        ops.map((o: any) => ({
          ...o,
          accountId: `accId_${owner}_${usdtContract}`,
          value: new BigNumber(o.value?.toString() ?? 0),
        })),
      );
      mockInferSubOpsByHash();

      const result = await runGetShape("address1");
      expect(result).toMatchObject({
        operations: [
          {
            type: "FEES",
            value: new BigNumber(1),
            senders: ["address1"],
            recipients: [usdtContract],
          },
        ],
        subAccounts: [
          {
            operations: [
              {
                type: "OUT",
                senders: ["address1"],
                recipients: ["contract1"],
                value: new BigNumber(2),
              },
            ],
          },
        ],
      });
    });

    test("Case 9: ETH transfer through smart contract", async () => {
      setupSpecTest();
      listOperationsMock.mockImplementation((addr: string) => {
        let items: ReturnType<typeof toCoreOp>[];
        switch (addr) {
          case "address1":
            items = [
              toCoreOp({
                type: "OUT",
                senders: ["address1"],
                recipients: ["contract1"],
                value: 2,
                fee: 1,
                feesPayer: "address1",
              }),
            ];
            break;
          default:
            items = [
              toCoreOp({
                type: "IN",
                senders: ["contract1"],
                recipients: ["address2"],
                value: 2,
                fee: 1,
                feesPayer: "address1",
              }),
            ];
        }
        return Promise.resolve({ items, next: undefined });
      });
      mockNoSubAccounts();
      mockNoInferSubOps();

      const result1 = await runGetShape("address1");
      expect(result1).toMatchObject({
        operations: [
          {
            type: "OUT",
            senders: ["address1"],
            recipients: ["contract1"],
            value: new BigNumber(3),
            fee: new BigNumber(1),
          },
        ],
      });

      const result2 = await runGetShape("address2");
      expect(result2).toMatchObject({
        operations: [
          {
            type: "IN",
            senders: ["contract1"],
            recipients: ["address2"],
            value: new BigNumber(2),
            fee: new BigNumber(1),
          },
        ],
      });
    });

    test("Case 10: mixed assets smart contract interaction", async () => {
      setupSpecTest();
      const usdtContract = "0xUSDTContract";
      listOperationsMock.mockImplementation((addr: string) => {
        let items: ReturnType<typeof toCoreOp>[];
        switch (addr) {
          case "address1":
            items = [
              toCoreOp({
                type: "OUT",
                senders: ["address1"],
                recipients: ["contract1"],
                value: 1,
                fee: 1,
                feesPayer: "address1",
              }),
              toCoreOp({
                type: "OUT",
                senders: ["address1"],
                recipients: ["address2"],
                value: 2,
                fee: 1,
                feesPayer: "address1",
                asset: { type: "erc20", assetReference: usdtContract, assetOwner: "address1" },
              }),
            ];
            break;
          default:
            items = [
              toCoreOp({
                type: "IN",
                senders: ["address1"],
                recipients: ["address2"],
                value: 2,
                fee: 1,
                feesPayer: "address1",
                asset: { type: "erc20", assetReference: usdtContract, assetOwner: "address2" },
              }),
            ];
        }
        return Promise.resolve({ items, next: undefined });
      });
      mockErc20SubAccounts(usdtContract);
      mockInferSubOpsByHash();

      const result1 = await runGetShape("address1");
      expect(result1).toMatchObject({
        operations: [
          {
            type: "OUT",
            value: new BigNumber(2),
            senders: ["address1"],
            recipients: ["contract1"],
          },
        ],
        subAccounts: [
          {
            operations: [
              {
                type: "OUT",
                senders: ["address1"],
                recipients: ["address2"],
                value: new BigNumber(2),
              },
            ],
          },
        ],
      });

      const result2 = await runGetShape("address2");
      expect(result2).toMatchObject({
        operations: [
          {
            type: "NONE",
            senders: ["address1"],
            recipients: [usdtContract],
            value: new BigNumber(0),
            fee: new BigNumber(1),
          },
        ],
        subAccounts: [
          {
            operations: [
              {
                type: "IN",
                senders: ["address1"],
                recipients: ["address2"],
                value: new BigNumber(2),
              },
            ],
          },
        ],
      });
    });

    test("Case 11: Spoofed ERC20 transfer through smart contract", async () => {
      setupSpecTest();
      const scamContract = "0xSCAMCOINContract";
      listOperationsMock.mockImplementation((addr: string) => {
        let items: ReturnType<typeof toCoreOp>[];
        switch (addr) {
          case "address1":
            items = [
              toCoreOp({
                type: "OUT",
                senders: ["address1"],
                recipients: ["contract1"],
                value: 0,
                fee: 1,
                feesPayer: "address1",
              }),
            ];
            break;
          case "address2":
            items = [
              toCoreOp({
                type: "OUT",
                senders: ["address2"],
                recipients: ["address3"],
                value: 2,
                fee: 1,
                feesPayer: "address1",
                asset: { type: "erc20", assetReference: scamContract, assetOwner: "address2" },
              }),
            ];
            break;
          default:
            items = [
              toCoreOp({
                type: "IN",
                senders: ["address2"],
                recipients: ["address3"],
                value: 2,
                fee: 1,
                feesPayer: "address1",
                asset: { type: "erc20", assetReference: scamContract, assetOwner: "address3" },
              }),
            ];
        }
        return Promise.resolve({ items, next: undefined });
      });
      mockErc20SubAccounts(scamContract);
      mockInferSubOpsByHash();

      const result1 = await runGetShape("address1");
      expect(result1).toMatchObject({
        operations: [
          {
            type: "FEES",
            value: new BigNumber(1),
            senders: ["address1"],
            recipients: ["contract1"],
          },
        ],
      });

      const result2 = await runGetShape("address2");
      expect(result2).toMatchObject({
        operations: [
          {
            type: "NONE",
            senders: ["address2"],
            recipients: [scamContract],
            value: new BigNumber(0),
            fee: new BigNumber(1),
          },
        ],
        subAccounts: [
          {
            operations: [
              {
                type: "OUT",
                senders: ["address2"],
                recipients: ["address3"],
                value: new BigNumber(2),
              },
            ],
          },
        ],
      });

      const result3 = await runGetShape("address3");
      expect(result3).toMatchObject({
        operations: [
          {
            type: "NONE",
            senders: ["address2"],
            recipients: [scamContract],
            value: new BigNumber(0),
            fee: new BigNumber(1),
          },
        ],
        subAccounts: [
          {
            operations: [
              {
                type: "IN",
                senders: ["address2"],
                recipients: ["address3"],
                value: new BigNumber(2),
              },
            ],
          },
        ],
      });
    });

    test("Case 12: Smart contract token minting", async () => {
      setupSpecTest();
      const stethContract = "0xSTETHContract";
      const zeroAddress = "0x0000000000000000000000000000000000000000";
      listOperationsMock.mockResolvedValue({
        items: [
          toCoreOp({
            type: "OUT",
            senders: ["address1"],
            recipients: ["contract1"],
            value: 1,
            fee: 1,
            feesPayer: "address1",
          }),
          toCoreOp({
            type: "IN",
            senders: [zeroAddress],
            recipients: ["address1"],
            value: 2,
            fee: 1,
            feesPayer: "address1",
            asset: { type: "erc20", assetReference: stethContract, assetOwner: "address1" },
          }),
        ],
        next: undefined,
      });
      mockErc20SubAccounts(stethContract);
      mockInferSubOpsByHash();

      const result = await runGetShape("address1");
      expect(result).toMatchObject({
        operations: [
          {
            type: "OUT",
            senders: ["address1"],
            recipients: ["contract1"],
            value: new BigNumber(2),
            fee: new BigNumber(1),
          },
        ],
        subAccounts: [
          {
            operations: [
              {
                type: "IN",
                senders: [zeroAddress],
                recipients: ["address1"],
                value: new BigNumber(2),
              },
            ],
          },
        ],
      });
    });
  });
});

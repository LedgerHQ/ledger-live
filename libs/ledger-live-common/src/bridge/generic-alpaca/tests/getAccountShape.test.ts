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
            type: "IN",
            blockHeight: 12,
            subOperations: [{ id: `${currency.id}_subOp1` }],
            extra: { assetReference: "ar2", assetOwner: "ow2" },
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
            type: "IN",
            blockHeight: 12,
            subOperations: [{ id: `${currency.id}_subOp1` }],
            extra: { assetReference: "ar2", assetOwner: "ow2" },
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
        extractBalanceMock.mockReturnValue({ value: "1000", locked: "300" });
        getBalanceMock.mockResolvedValue([
          { asset: { type: "native" }, value: "1000", locked: "300" },
          { asset: { type: "token", symbol: "TOK1" }, value: "42" },
          { asset: { type: "token", symbol: "TOK_IGNORE" }, value: "5" },
        ]);

        getTokenFromAssetMock.mockImplementation(asset =>
          asset.symbol === "TOK1" ? { id: `${currency.id}_token1` } : null,
        );

        const coreOp = { hash: "h2", height: 12 };
        listOperationsMock.mockResolvedValue([[coreOp]]);
        refreshOperationsMock.mockImplementation(ops => {
          const op = ops[0];
          if (op?.hash === "h0") {
            return [{ ...op, blockHeight: 12 }];
          }
          return [];
        });

        adaptCoreOperationToLiveOperationMock.mockImplementation((_accId, op) => ({
          hash: op.hash,
          type: "IN",
          blockHeight: 12,
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

        expect(listOperationsMock).toHaveBeenCalledWith(`${currency.id}_addr1`, expectedPagination);

        const assetsBalancePassed = buildSubAccountsMock.mock.calls[0][0].allTokenAssetsBalances;
        expect(assetsBalancePassed).toEqual([
          { asset: { symbol: "TOK1", type: "token" }, value: "42" },
          { asset: { symbol: "TOK_IGNORE", type: "token" }, value: "5" },
        ]);

        const assetOpsPassed = buildSubAccountsMock.mock.calls[0][0].operations;
        expect(assetOpsPassed).toHaveLength(1);
        expect(assetOpsPassed[0].hash).toBe("h2");

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
      getBalanceMock.mockResolvedValue([{ asset: { type: "native" }, value: "0", locked: "0" }]);
      extractBalanceMock.mockReturnValue({ value: "0", locked: "0" });
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
  });
});

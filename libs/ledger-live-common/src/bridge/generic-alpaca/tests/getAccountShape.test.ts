import BigNumber from "bignumber.js";
import { genericGetAccountShape } from "../getAccountShape";

jest.mock("@ledgerhq/coin-framework/account/index", () => ({
  encodeAccountId: jest.fn(() => "accId"),
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
jest.mock("../alpaca", () => ({
  getAlpacaApi: () => ({
    lastBlock: (...a: any[]) => lastBlockMock(...a),
    getBalance: (...a: any[]) => getBalanceMock(...a),
    listOperations: (...a: any[]) => listOperationsMock(...a),
    getTokenFromAsset: (...a: any[]) => getTokenFromAssetMock(...a),
    getChainSpecificRules: () => ({
      getAccountShape: (...a: any[]) => chainSpecificGetAccountShapeMock(...a),
    }),
  }),
}));

const adaptCoreOperationToLiveOperationMock = jest.fn();
const extractBalanceMock = jest.fn();
jest.mock("../utils", () => ({
  adaptCoreOperationToLiveOperation: (...a: any[]) => adaptCoreOperationToLiveOperationMock(...a),
  extractBalance: (...a: any[]) => extractBalanceMock(...a),
}));

const inferSubOperationsMock = jest.fn();
jest.mock("@ledgerhq/coin-framework/serialization", () => ({
  inferSubOperations: (...a: any[]) => inferSubOperationsMock(...a),
}));

const buildSubAccountsMock = jest.fn();
jest.mock("../buildSubAccounts", () => ({
  buildSubAccounts: (...a: any[]) => buildSubAccountsMock(...a),
}));

// Test matrix for Stellar & XRP
const chains = [
  { currency: { id: "stellar", name: "Stellar" }, network: "testnet" },
  { currency: { id: "ripple", name: "XRP" }, network: "mainnet" },
];

describe("genericGetAccountShape (stellar & xrp)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe.each(chains)("$currency.id", ({ currency, network }) => {
    test("builds account shape with existing operations, pagination and sub accounts", async () => {
      const oldOp = {
        hash: "h1",
        blockHeight: 10,
        type: "OPT_IN",
        extra: { pagingToken: "pt1", assetReference: "ar1", assetOwner: "ow1" },
      };
      const initialAccount = { operations: [oldOp], blockHeight: 10 };

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

      adaptCoreOperationToLiveOperationMock.mockImplementation((_accId, op) => ({
        hash: op.hash,
        type: "IN",
        blockHeight: 12,
        extra: { assetReference: "ar2", assetOwner: "ow2" },
      }));

      mergeOpsMock.mockImplementation((oldOps, newOps) => [...newOps, ...oldOps]);

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
        minHeight: 11,
        order: "asc",
        lastPagingToken: "pt1",
      });

      const assetsBalancePassed = buildSubAccountsMock.mock.calls[0][0].assetsBalance;
      expect(assetsBalancePassed).toHaveLength(1);
      expect(assetsBalancePassed[0].asset.symbol).toBe("TOK1");

      const assetOpsPassed = buildSubAccountsMock.mock.calls[0][0].operations;
      expect(assetOpsPassed).toHaveLength(1);
      expect(assetOpsPassed[0].hash).toBe("h2");

      expect(result).toMatchObject({
        balance: new BigNumber(1000),
        spendableBalance: new BigNumber(700),
        blockHeight: 123,
        operationsCount: 2,
        subAccounts: [{ id: `${currency.id}_subAcc1`, type: "TokenAccount" }],
        operations: [
          {
            hash: "h2",
            type: "IN",
            blockHeight: 12,
            subOperations: [{ id: `${currency.id}_subOp1` }],
            extra: { assetReference: "ar2", assetOwner: "ow2" },
          },
          oldOp,
        ],
      });
    });

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

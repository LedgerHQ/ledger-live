import { getAccountShape } from "./synchronisation";
import { BigNumber } from "bignumber.js";
import type { MultiversXAccount } from "./types";

jest.mock("@ledgerhq/coin-framework/account/index", () => ({
  encodeAccountId: jest.fn(() => "account_id_123"),
}));

jest.mock("@ledgerhq/coin-framework/bridge/jsHelpers", () => ({
  makeSync: jest.fn(({ getAccountShape }) => getAccountShape),
  mergeOps: jest.fn((oldOps, newOps) => [...oldOps, ...newOps]),
}));

jest.mock("@ledgerhq/coin-framework/serialization/index", () => ({
  inferSubOperations: jest.fn(() => []),
}));

jest.mock("./api", () => ({
  getAccount: jest.fn(),
  getAccountDelegations: jest.fn(),
  getEGLDOperations: jest.fn(),
  hasESDTTokens: jest.fn(),
}));

jest.mock("./buildSubAccounts", () => jest.fn());

jest.mock("./reconciliation", () => ({
  reconciliateSubAccounts: jest.fn((tokenAccounts) => tokenAccounts),
}));

jest.mock("./logic", () => ({
  computeDelegationBalance: jest.fn(() => new BigNumber(0)),
}));

const { getAccount, getAccountDelegations, getEGLDOperations, hasESDTTokens } =
  jest.requireMock("./api");
const MultiversXBuildESDTTokenAccounts = jest.requireMock("./buildSubAccounts");
const { computeDelegationBalance } = jest.requireMock("./logic");

describe("synchronisation", () => {
  const createCurrency = () => ({
    id: "multiversx",
    name: "MultiversX",
    ticker: "EGLD",
    units: [{ code: "EGLD", magnitude: 18, name: "EGLD" }],
  });

  beforeEach(() => {
    jest.clearAllMocks();

    getAccount.mockResolvedValue({
      balance: new BigNumber("10000000000000000000"),
      nonce: 5,
      blockHeight: 1000,
      isGuarded: false,
    });

    getAccountDelegations.mockResolvedValue([]);
    getEGLDOperations.mockResolvedValue([]);
    hasESDTTokens.mockResolvedValue(false);
    computeDelegationBalance.mockReturnValue(new BigNumber(0));
  });

  describe("getAccountShape", () => {
    it("returns account shape with correct structure", async () => {
      const info = {
        address: "erd1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq6gq4hu",
        initialAccount: undefined,
        currency: createCurrency(),
        derivationMode: "",
      };

      const result = await getAccountShape(info, {});

      expect(result).toMatchObject({
        id: "account_id_123",
        balance: expect.any(BigNumber),
        spendableBalance: expect.any(BigNumber),
        operationsCount: expect.any(Number),
        blockHeight: 1000,
        multiversxResources: {
          nonce: 5,
          delegations: [],
          isGuarded: false,
        },
      });
    });

    it("includes delegation balance in total balance", async () => {
      computeDelegationBalance.mockReturnValue(new BigNumber("5000000000000000000"));

      const info = {
        address: "erd1test",
        initialAccount: undefined,
        currency: createCurrency(),
        derivationMode: "",
      };

      const result = await getAccountShape(info, {});

      expect(result.balance.toString()).toBe("15000000000000000000"); // 10 + 5
      expect(result.spendableBalance.toString()).toBe("10000000000000000000"); // Only spendable
    });

    it("merges operations with existing operations", async () => {
      const existingOps = [
        {
          id: "op1",
          hash: "hash1",
          date: new Date("2024-01-01"),
        },
      ];

      getEGLDOperations.mockResolvedValue([
        {
          id: "op2",
          hash: "hash2",
          date: new Date("2024-01-02"),
        },
      ]);

      const info = {
        address: "erd1test",
        initialAccount: {
          operations: existingOps,
        } as unknown as MultiversXAccount,
        currency: createCurrency(),
        derivationMode: "",
      };

      const result = await getAccountShape(info, {});

      expect(result.operations).toHaveLength(2);
    });

    it("builds ESDT token accounts when hasTokens is true", async () => {
      hasESDTTokens.mockResolvedValue(true);
      MultiversXBuildESDTTokenAccounts.mockResolvedValue([
        {
          id: "token1",
          type: "TokenAccount",
          balance: new BigNumber("100000"),
        },
      ]);

      const info = {
        address: "erd1test",
        initialAccount: undefined,
        currency: createCurrency(),
        derivationMode: "",
      };

      const result = await getAccountShape(info, {});

      expect(MultiversXBuildESDTTokenAccounts).toHaveBeenCalled();
      expect(result.subAccounts).toHaveLength(1);
    });

    it("does not build ESDT token accounts when hasTokens is false", async () => {
      hasESDTTokens.mockResolvedValue(false);

      const info = {
        address: "erd1test",
        initialAccount: undefined,
        currency: createCurrency(),
        derivationMode: "",
      };

      const result = await getAccountShape(info, {});

      expect(MultiversXBuildESDTTokenAccounts).not.toHaveBeenCalled();
      expect(result.subAccounts).toEqual([]);
    });

    it("handles null token accounts from buildSubAccounts", async () => {
      hasESDTTokens.mockResolvedValue(true);
      MultiversXBuildESDTTokenAccounts.mockResolvedValue(null);

      const info = {
        address: "erd1test",
        initialAccount: undefined,
        currency: createCurrency(),
        derivationMode: "",
      };

      const result = await getAccountShape(info, {});

      expect(result.subAccounts).toEqual([]);
    });

    it("calculates startAt from existing operations for incremental sync", async () => {
      const existingOps = [
        {
          id: "op1",
          hash: "hash1",
          date: new Date("2024-01-15T12:00:00Z"),
        },
      ];

      const info = {
        address: "erd1test",
        initialAccount: {
          operations: existingOps,
        } as unknown as MultiversXAccount,
        currency: createCurrency(),
        derivationMode: "",
      };

      await getAccountShape(info, {});

      expect(getEGLDOperations).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        Math.floor(existingOps[0].date.valueOf() / 1000),
        expect.any(Array),
      );
    });

    it("uses startAt of 0 when no existing operations", async () => {
      const info = {
        address: "erd1test",
        initialAccount: undefined,
        currency: createCurrency(),
        derivationMode: "",
      };

      await getAccountShape(info, {});

      expect(getEGLDOperations).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        0,
        expect.any(Array),
      );
    });

    it("infers sub-operations for each operation", async () => {
      const { inferSubOperations } = jest.requireMock("@ledgerhq/coin-framework/serialization/index");
      inferSubOperations.mockReturnValue([{ id: "subOp1" }]);

      getEGLDOperations.mockResolvedValue([
        {
          id: "op1",
          hash: "hash1",
          date: new Date(),
        },
      ]);

      const info = {
        address: "erd1test",
        initialAccount: undefined,
        currency: createCurrency(),
        derivationMode: "",
      };

      const result = await getAccountShape(info, {});

      expect(result.operations[0].subOperations).toEqual([{ id: "subOp1" }]);
    });
  });
});

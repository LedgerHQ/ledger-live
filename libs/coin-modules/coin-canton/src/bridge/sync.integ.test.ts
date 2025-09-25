import BigNumber from "bignumber.js";
import { AccountShapeInfo } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import {
  getDerivationModesForCurrency,
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/coin-framework/derivation";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { Account, Operation } from "@ledgerhq/types-live";
import coinConfig from "../config";
import * as gateway from "../network/gateway";
import { getAccountShape } from "./sync";

const TEST_ADDRESS =
  "b6400f93ea1c74aea86be39b0ccc846fc5de01f12b2ad0d7c31848d6fb6eb6d9::1220c81315e2bf2524a9141bcc6cbf19b61c151e0dcaa95343c0ccf53aed7415c4ec";
const currency = getCryptoCurrencyById("canton_network");
const derivationMode = getDerivationModesForCurrency(currency)[0];
const derivationPath = runDerivationScheme(
  getDerivationScheme({ derivationMode, currency }),
  currency,
  {
    account: 0,
  },
);
const ACCOUNT_SHAPE_INFO: AccountShapeInfo = {
  address: TEST_ADDRESS,
  currency,
  derivationMode,
  derivationPath,
  index: 0,
};

describe("sync (devnet)", () => {
  beforeAll(async () => {
    coinConfig.setCoinConfig(() => ({
      gatewayUrl: "https://canton-gateway.api.live.ledger-test.com",
      useGateway: true,
      networkType: "devnet",
      nativeInstrumentId: "Amulet",
      status: {
        type: "active",
      },
    }));
  });

  describe("getAccountShape", () => {
    it("should fetch account shape for a valid address", async () => {
      const result = await getAccountShape(ACCOUNT_SHAPE_INFO, { paginationConfig: {} });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.xpub).toBe(TEST_ADDRESS.replace(/:/g, "_"));
      expect(result.blockHeight).toBeGreaterThan(0);
      expect(result.balance).toBeDefined();
      expect(result.spendableBalance).toBeDefined();
      expect(result.operations).toBeDefined();
      expect(result.operationsCount).toBeGreaterThanOrEqual(0);

      expect(result.balance).toBeInstanceOf(Object);
      expect(result.balance?.toNumber).toBeDefined();
      expect(result.spendableBalance).toBeInstanceOf(Object);
      expect(result.spendableBalance?.toNumber).toBeDefined();

      expect(result.spendableBalance?.toNumber()).toBeLessThanOrEqual(
        result.balance?.toNumber() || 0,
      );
    });

    it("should handle address with colons correctly", async () => {
      const result = await getAccountShape(ACCOUNT_SHAPE_INFO, { paginationConfig: {} });

      expect(result.xpub).toBe(TEST_ADDRESS.replace(/:/g, "_"));
    });

    it("should merge operations correctly with initial account", async () => {
      const operations: Operation[] = [
        {
          id: "test-op-1",
          hash: "test-hash-1",
          accountId: "test-account",
          type: "OUT" as const,
          value: new BigNumber(1000000),
          fee: new BigNumber(100000),
          blockHash: "block-hash-1",
          blockHeight: 100,
          senders: [TEST_ADDRESS],
          recipients: ["recipient-1"],
          date: new Date("2023-01-01"),
          transactionSequenceNumber: 100,
          extra: { uid: "uid-1" },
        },
      ];

      const result = await getAccountShape(
        {
          ...ACCOUNT_SHAPE_INFO,
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
          initialAccount: { operations } as Account,
        },
        { paginationConfig: {} },
      );

      expect(result.operations).toBeDefined();
      expect(result.operationsCount).toBeGreaterThanOrEqual(1);
      const initialOp = result.operations?.find(op => op.id === "test-op-1");
      expect(initialOp).toBeDefined();
    });

    it("should take locked balance into account when calculating spendable balance", async () => {
      const mockGetBalance = jest.spyOn(gateway, "getBalance");

      mockGetBalance.mockResolvedValue([
        {
          instrument_id: "Amulet",
          amount: 1000000,
          locked: true,
        },
      ]);

      const result = await getAccountShape(ACCOUNT_SHAPE_INFO, { paginationConfig: {} });

      expect(result.balance?.toNumber()).toBe(1000000);
      expect(result.spendableBalance?.toNumber()).toBe(0);

      mockGetBalance.mockRestore();
    });

    it("should call getOperations with correct cursor based with initial account", async () => {
      const mockGetOperations = jest.spyOn(gateway, "getOperations");
      const operation: Operation = {
        id: "test-op-1",
        hash: "test-hash-1",
        accountId: "test-account",
        type: "OUT" as const,
        value: new BigNumber(1000000),
        fee: new BigNumber(100000),
        blockHash: "block-hash-1",
        blockHeight: 100,
        senders: [TEST_ADDRESS],
        recipients: ["recipient-1"],
        date: new Date("2023-01-01"),
        transactionSequenceNumber: 100,
        extra: { uid: "uid-1" },
      };

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const initialAccount = { operations: [operation] } as Account;

      const result = await getAccountShape(
        {
          ...ACCOUNT_SHAPE_INFO,
          initialAccount,
        },
        { paginationConfig: {} },
      );

      expect(mockGetOperations).toHaveBeenCalledWith(TEST_ADDRESS, {
        cursor: (operation.blockHeight || 0) + 1,
        limit: 100,
      });
      expect(result.operations).toBeDefined();
      expect(result.operationsCount).toBeGreaterThan(1);
    });

    it("should call getOperations with cursor 0 when no initial account", async () => {
      const mockGetOperations = jest.spyOn(gateway, "getOperations");

      const result = await getAccountShape(ACCOUNT_SHAPE_INFO, { paginationConfig: {} });

      expect(result.operations).toBeDefined();
      expect(result.operationsCount).toBeGreaterThanOrEqual(1);

      expect(mockGetOperations).toHaveBeenCalledWith(TEST_ADDRESS, {
        cursor: 0,
        limit: 100,
      });

      mockGetOperations.mockRestore();
    });
  });
});

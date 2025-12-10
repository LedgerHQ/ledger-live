import { AccountShapeInfo } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getDerivationModesForCurrency } from "@ledgerhq/coin-framework/derivation";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { Account, Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import coinConfig from "../config";
import * as gateway from "../network/gateway";
import { createMockSigner, generateMockKeyPair } from "../test/cantonTestUtils";
import { CantonAccount } from "../types";
import { makeGetAccountShape } from "./sync";

const TEST_ADDRESS = "alice::1220f6efa949a0dcaab8bb1a066cf0ecbca370375e90552edd6d33c14be01082b000";
const currency = getCryptoCurrencyById("canton_network");
const derivationMode = getDerivationModesForCurrency(currency)[0];
const derivationPath = "44'/6767'/0'/0'/0'";
const ACCOUNT_SHAPE_INFO: AccountShapeInfo<CantonAccount> = {
  address: TEST_ADDRESS,
  currency,
  derivationMode,
  derivationPath,
  index: 0,
  initialAccount: {
    xpub: TEST_ADDRESS,
  } as CantonAccount,
};
const TIMEOUT = 30000;

const keyPair = generateMockKeyPair();
const mockSigner = createMockSigner(keyPair);
const mockSignerContext = jest.fn().mockImplementation((deviceId, callback) => {
  return callback(mockSigner);
});

describe.skip("sync (devnet)", () => {
  beforeAll(async () => {
    coinConfig.setCoinConfig(() => ({
      gatewayUrl: "https://canton-gateway-devnet.api.live.ledger-test.com",
      useGateway: true,
      networkType: "devnet",
      nativeInstrumentId: "Amulet",
      status: {
        type: "active",
      },
    }));
  });

  describe("makeGetAccountShape", () => {
    it(
      "should fetch account shape for a valid address",
      async () => {
        const getAccountShape = makeGetAccountShape(mockSignerContext);
        const result = await getAccountShape(ACCOUNT_SHAPE_INFO, { paginationConfig: {} });

        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.xpub).toBe(TEST_ADDRESS);
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
      },
      TIMEOUT,
    );

    it(
      "should handle address with colons correctly",
      async () => {
        const getAccountShape = makeGetAccountShape(mockSignerContext);
        const result = await getAccountShape(ACCOUNT_SHAPE_INFO, { paginationConfig: {} });

        expect(result.xpub).toContain("::");
      },
      TIMEOUT,
    );

    it(
      "should merge operations correctly with initial account",
      async () => {
        const getAccountShape = makeGetAccountShape(mockSignerContext);

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
            transactionSequenceNumber: BigNumber(100),
            extra: { uid: "uid-1" },
          },
        ];

        const result = await getAccountShape(
          {
            ...ACCOUNT_SHAPE_INFO,
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            initialAccount: { xpub: TEST_ADDRESS, operations } as Account,
          },
          { paginationConfig: {} },
        );

        expect(result.operations).toBeDefined();
        expect(result.operationsCount).toBeGreaterThanOrEqual(1);
        const initialOp = result.operations?.find(op => op.id === "test-op-1");
        expect(initialOp).toBeDefined();
      },
      TIMEOUT,
    );

    it(
      "should take locked balance into account when calculating spendable balance",
      async () => {
        const mockGetBalance = jest.spyOn(gateway, "getBalance");

        mockGetBalance.mockResolvedValue([
          {
            instrument_id: "Amulet",
            amount: "500",
            locked: false,
          },
          {
            instrument_id: "LockedAmulet",
            amount: "1000000",
            locked: true,
          },
        ]);

        const getAccountShape = makeGetAccountShape(mockSignerContext);
        const result = await getAccountShape(ACCOUNT_SHAPE_INFO, { paginationConfig: {} });

        expect(result.balance?.toNumber()).toBe(1000500);
        expect(result.spendableBalance?.toNumber()).toBe(500);

        mockGetBalance.mockRestore();
      },
      TIMEOUT,
    );

    it(
      "should call getOperations with correct cursor based on initial account",
      async () => {
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
          transactionSequenceNumber: BigNumber(100),
          extra: { uid: "uid-1" },
        };

        const getAccountShape = makeGetAccountShape(mockSignerContext);
        const result = await getAccountShape(
          {
            ...ACCOUNT_SHAPE_INFO,
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            initialAccountL: { xpub: TEST_ADDRESS, operations: [operation] } as Account,
          },
          { paginationConfig: {} },
        );

        expect(mockGetOperations).toHaveBeenCalledWith(currency, TEST_ADDRESS, {
          cursor: (operation.blockHeight || 0) + 1,
          limit: 100,
        });
        expect(result.operations).toBeDefined();
        expect(result.operationsCount).toBeGreaterThan(1);
      },
      TIMEOUT,
    );

    it(
      "should call getOperations with cursor 0 when no initial account",
      async () => {
        const mockGetOperations = jest.spyOn(gateway, "getOperations");

        const getAccountShape = makeGetAccountShape(mockSignerContext);
        const result = await getAccountShape(ACCOUNT_SHAPE_INFO, { paginationConfig: {} });

        expect(result.operations).toBeDefined();
        expect(result.operationsCount).toBeGreaterThanOrEqual(1);

        expect(mockGetOperations).toHaveBeenCalledWith(currency, TEST_ADDRESS, {
          cursor: 0,
          limit: 100,
        });

        mockGetOperations.mockRestore();
      },
      TIMEOUT,
    );
  });
});

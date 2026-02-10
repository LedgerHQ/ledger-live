import { DerivationMode } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import * as api from "../api/api";
import * as tokenAccounts from "../erc20/tokenAccounts";
import {
  createMockAccount,
  createMockTransactionResponse,
  createMockTransaction,
  TEST_ADDRESSES,
  createMockBalanceResponse,
  createMockTokenAccount,
  TEST_BLOCK_HEIGHTS,
} from "../test/fixtures";
import { TxStatus } from "../types";
import {
  mapTxToOps,
  getAddress,
  getTxToBroadcast,
  getAccountShape,
  getSubAccount,
  valueFromUnit,
} from "./utils";

// Mock API and token account modules
jest.mock("../api/api");
jest.mock("../erc20/tokenAccounts");

describe("common-logic/utils", () => {
  describe("mapTxToOps", () => {
    const createAccountShapeInfo = (address: string) => ({
      address,
      currency: createMockAccount().currency,
      index: 0,
      derivationPath: "44'/461'/0'/0/0",
      derivationMode: "" as DerivationMode,
    });

    it("should convert send transaction to OUT operation", () => {
      const account = createMockAccount({
        freshAddress: TEST_ADDRESSES.F1_ADDRESS,
      });

      const tx = createMockTransactionResponse({
        from: TEST_ADDRESSES.F1_ADDRESS,
        to: TEST_ADDRESSES.RECIPIENT_F1,
        amount: "100000000000000000",
        status: TxStatus.Ok,
      });

      const mapper = mapTxToOps(account.id, createAccountShapeInfo(TEST_ADDRESSES.F1_ADDRESS));
      const ops = mapper(tx);

      expect(ops).toHaveLength(1);
      expect(ops[0].type).toBe("OUT");
      expect(ops[0].value.gt(new BigNumber("100000000000000000"))).toBe(true); // includes fees
      expect(ops[0].hasFailed).toBe(false);
    });

    it("should convert receive transaction to IN operation", () => {
      const account = createMockAccount({
        freshAddress: TEST_ADDRESSES.RECIPIENT_F1,
      });

      const tx = createMockTransactionResponse({
        from: TEST_ADDRESSES.F1_ADDRESS,
        to: TEST_ADDRESSES.RECIPIENT_F1,
        amount: "100000000000000000",
      });

      const mapper = mapTxToOps(account.id, createAccountShapeInfo(TEST_ADDRESSES.RECIPIENT_F1));
      const ops = mapper(tx);

      expect(ops).toHaveLength(1);
      expect(ops[0].type).toBe("IN");
      expect(ops[0].value.isEqualTo(new BigNumber("100000000000000000"))).toBe(true);
    });

    it("should handle zero amount transaction as FEES", () => {
      const account = createMockAccount({
        freshAddress: TEST_ADDRESSES.F1_ADDRESS,
      });

      const tx = createMockTransactionResponse({
        from: TEST_ADDRESSES.F1_ADDRESS,
        to: TEST_ADDRESSES.RECIPIENT_F1,
        amount: "0",
      });

      const mapper = mapTxToOps(account.id, createAccountShapeInfo(TEST_ADDRESSES.F1_ADDRESS));
      const ops = mapper(tx);

      expect(ops).toHaveLength(1);
      expect(ops[0].type).toBe("FEES");
    });

    it("should mark failed transactions", () => {
      const account = createMockAccount({
        freshAddress: TEST_ADDRESSES.F1_ADDRESS,
      });

      const tx = createMockTransactionResponse({
        from: TEST_ADDRESSES.F1_ADDRESS,
        to: TEST_ADDRESSES.RECIPIENT_F1,
        status: "Fail",
      });

      const mapper = mapTxToOps(account.id, createAccountShapeInfo(TEST_ADDRESSES.F1_ADDRESS));
      const ops = mapper(tx);

      expect(ops[0].hasFailed).toBe(true);
    });

    it("should handle self-transfer (both send and receive)", () => {
      const account = createMockAccount({
        freshAddress: TEST_ADDRESSES.F1_ADDRESS,
      });

      const tx = createMockTransactionResponse({
        from: TEST_ADDRESSES.F1_ADDRESS,
        to: TEST_ADDRESSES.F1_ADDRESS,
        amount: "100000000000000000",
      });

      const mapper = mapTxToOps(account.id, createAccountShapeInfo(TEST_ADDRESSES.F1_ADDRESS));
      const ops = mapper(tx);

      expect(ops).toHaveLength(2);
      expect(ops.some(op => op.type === "OUT")).toBe(true);
      expect(ops.some(op => op.type === "IN")).toBe(true);
    });
  });

  describe("getAddress", () => {
    it("should extract address and derivation path from account", () => {
      const account = createMockAccount({
        freshAddress: TEST_ADDRESSES.F1_ADDRESS,
        freshAddressPath: "44'/461'/0'/0/0",
      });

      const result = getAddress(account);

      expect(result.address).toBe(TEST_ADDRESSES.F1_ADDRESS);
      expect(result.derivationPath).toBe("44'/461'/0'/0/0");
    });
  });

  describe("getTxToBroadcast", () => {
    it("should format transaction for broadcasting", () => {
      const rawData = {
        sender: TEST_ADDRESSES.F1_ADDRESS,
        recipient: TEST_ADDRESSES.RECIPIENT_F1,
        gasLimit: new BigNumber(1000000),
        gasFeeCap: new BigNumber("100000"),
        gasPremium: new BigNumber("100000"),
        method: 0,
        version: 0,
        nonce: 5,
        signatureType: 1,
        params: "",
        value: "100000000000000000",
      };

      const result = getTxToBroadcast("signature_data", rawData);

      expect(result.message.from).toBe(TEST_ADDRESSES.F1_ADDRESS);
      expect(result.message.to).toBe(TEST_ADDRESSES.RECIPIENT_F1);
      expect(result.message.gaslimit).toBe(1000000);
      expect(result.message.gasfeecap).toBe("100000");
      expect(result.message.gaspremium).toBe("100000");
      expect(result.message.nonce).toBe(5);
      expect(result.signature.type).toBe(1);
      expect(result.signature.data).toBe("signature_data");
    });

    it("should handle ERC20 contract calls with params", () => {
      const rawData = {
        sender: TEST_ADDRESSES.F4_ADDRESS,
        recipient: TEST_ADDRESSES.ERC20_CONTRACT,
        gasLimit: new BigNumber(2000000),
        gasFeeCap: new BigNumber("200000"),
        gasPremium: new BigNumber("150000"),
        method: 3844450837,
        version: 0,
        nonce: 10,
        signatureType: 1,
        params: "base64encodedparams",
        value: "0",
      };

      const result = getTxToBroadcast("sig", rawData);

      expect(result.message.params).toBe("base64encodedparams");
      expect(result.message.method).toBe(3844450837);
      expect(result.message.value).toBe("0");
    });
  });

  describe("getAccountShape", () => {
    const mockedFetchBlockHeight = api.fetchBlockHeight as jest.MockedFunction<
      typeof api.fetchBlockHeight
    >;
    const mockedFetchBalances = api.fetchBalances as jest.MockedFunction<typeof api.fetchBalances>;
    const mockedFetchTxsWithPages = api.fetchTxsWithPages as jest.MockedFunction<
      typeof api.fetchTxsWithPages
    >;
    const mockedBuildTokenAccounts = tokenAccounts.buildTokenAccounts as jest.MockedFunction<
      typeof tokenAccounts.buildTokenAccounts
    >;

    const mockSyncConfig = {
      paginationConfig: {},
      blacklistedTokenIds: [],
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should fetch and build account shape with balances and token accounts", async () => {
      const mockAccount = createMockAccount({
        freshAddress: TEST_ADDRESSES.F1_ADDRESS,
        blockHeight: TEST_BLOCK_HEIGHTS.CURRENT,
      });

      const mockBalance = createMockBalanceResponse({
        total_balance: "1000000000000000000",
        spendable_balance: "900000000000000000",
      });

      const mockBlockHeight = {
        current_block_identifier: {
          index: TEST_BLOCK_HEIGHTS.CURRENT,
          hash: "current_block_hash",
        },
        genesis_block_identifier: {
          index: 0,
          hash: "genesis",
        },
        current_block_timestamp: Date.now(),
      };

      const mockTxs = [
        createMockTransactionResponse({
          from: TEST_ADDRESSES.F1_ADDRESS,
          to: TEST_ADDRESSES.RECIPIENT_F1,
        }),
      ];

      const mockParentAccount = createMockAccount();
      const mockTokenAccounts = [
        createMockTokenAccount(mockParentAccount, {
          balance: new BigNumber("5000000000000000000"),
        }),
      ];

      mockedFetchBlockHeight.mockResolvedValue(mockBlockHeight);
      mockedFetchBalances.mockResolvedValue(mockBalance);
      mockedFetchTxsWithPages.mockResolvedValue(mockTxs);
      mockedBuildTokenAccounts.mockResolvedValue(mockTokenAccounts);

      const info = {
        address: TEST_ADDRESSES.F1_ADDRESS,
        currency: mockAccount.currency,
        derivationMode: "" as DerivationMode,
        initialAccount: mockAccount,
        index: 0,
        derivationPath: "44'/461'/0'/0/0",
      };

      const result = await getAccountShape(info, mockSyncConfig);

      expect(result.balance?.isEqualTo(new BigNumber("1000000000000000000"))).toBe(true);
      expect(result.spendableBalance?.isEqualTo(new BigNumber("900000000000000000"))).toBe(true);
      expect(result.blockHeight).toBe(TEST_BLOCK_HEIGHTS.CURRENT);
      expect(result.subAccounts).toEqual(mockTokenAccounts);
      expect(result.operations).toBeInstanceOf(Array);
    });

    it("should handle block height safe delta correctly", async () => {
      const mockAccount = createMockAccount({
        blockHeight: 500, // Less than blockSafeDelta (1200)
      });

      const mockBalance = createMockBalanceResponse();
      const mockBlockHeight = {
        current_block_identifier: {
          index: TEST_BLOCK_HEIGHTS.CURRENT,
          hash: "hash",
        },
        genesis_block_identifier: {
          index: 0,
          hash: "genesis",
        },
        current_block_timestamp: Date.now(),
      };

      mockedFetchBlockHeight.mockResolvedValue(mockBlockHeight);
      mockedFetchBalances.mockResolvedValue(mockBalance);
      mockedFetchTxsWithPages.mockResolvedValue([]);
      mockedBuildTokenAccounts.mockResolvedValue([]);

      const info = {
        address: TEST_ADDRESSES.F1_ADDRESS,
        currency: mockAccount.currency,
        derivationMode: "" as DerivationMode,
        initialAccount: mockAccount,
        index: 0,
        derivationPath: "44'/461'/0'/0/0",
      };

      await getAccountShape(info, mockSyncConfig);

      // Should call fetchTxsWithPages with lastHeight = 0 (not negative)
      expect(mockedFetchTxsWithPages).toHaveBeenCalledWith(TEST_ADDRESSES.F1_ADDRESS, 0);
    });

    it("should sort operations by date descending", async () => {
      const now = Math.floor(Date.now() / 1000);
      const mockBalance = createMockBalanceResponse();
      const mockBlockHeight = {
        current_block_identifier: {
          index: TEST_BLOCK_HEIGHTS.CURRENT,
          hash: "hash",
        },
        genesis_block_identifier: {
          index: 0,
          hash: "genesis",
        },
        current_block_timestamp: Date.now(),
      };

      const mockTxs = [
        createMockTransactionResponse({
          hash: "tx1",
          timestamp: now - 1000,
          from: TEST_ADDRESSES.F1_ADDRESS,
          to: TEST_ADDRESSES.RECIPIENT_F1,
        }),
        createMockTransactionResponse({
          hash: "tx2",
          timestamp: now - 500,
          from: TEST_ADDRESSES.F1_ADDRESS,
          to: TEST_ADDRESSES.RECIPIENT_F1,
        }),
        createMockTransactionResponse({
          hash: "tx3",
          timestamp: now - 2000,
          from: TEST_ADDRESSES.F1_ADDRESS,
          to: TEST_ADDRESSES.RECIPIENT_F1,
        }),
      ];

      mockedFetchBlockHeight.mockResolvedValue(mockBlockHeight);
      mockedFetchBalances.mockResolvedValue(mockBalance);
      mockedFetchTxsWithPages.mockResolvedValue(mockTxs);
      mockedBuildTokenAccounts.mockResolvedValue([]);

      const info = {
        address: TEST_ADDRESSES.F1_ADDRESS,
        currency: createMockAccount().currency,
        derivationMode: "" as DerivationMode,
        initialAccount: undefined,
        index: 0,
        derivationPath: "44'/461'/0'/0/0",
      };

      const result = await getAccountShape(info, mockSyncConfig);

      // Operations should be sorted newest first
      expect(result.operations?.[0].hash).toBe("tx2");
      expect(result.operations?.[1].hash).toBe("tx1");
      expect(result.operations?.[2].hash).toBe("tx3");
    });
  });

  describe("getSubAccount", () => {
    it("should return sub account when transaction has subAccountId", () => {
      const account = createMockAccount();
      const subAccount = createMockTokenAccount(account, {
        id: "subaccount123",
      });

      const accountWithSub = createMockAccount({
        subAccounts: [subAccount],
      });

      const transaction = createMockTransaction({
        subAccountId: "subaccount123",
      });

      const result = getSubAccount(accountWithSub, transaction);

      expect(result).toEqual(subAccount);
    });
  });

  describe("valueFromUnit", () => {
    it("should convert value with unit magnitude", () => {
      const unit = {
        name: "FIL",
        code: "FIL",
        magnitude: 18,
      };

      const result = valueFromUnit(new BigNumber(1), unit);

      expect(result.isEqualTo(new BigNumber("1000000000000000000"))).toBe(true);
    });

    it("should handle decimal values", () => {
      const unit = {
        name: "FIL",
        code: "FIL",
        magnitude: 18,
      };

      const result = valueFromUnit(new BigNumber("0.5"), unit);

      expect(result.isEqualTo(new BigNumber("500000000000000000"))).toBe(true);
    });
  });
});

import * as coinFrameworkAccount from "@ledgerhq/coin-framework/account";
import type { AccountShapeInfo } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import type { Account } from "@ledgerhq/types-live";
import hederaCoinConfig from "../config";
import * as logic from "../logic";
import * as logicUtils from "../logic/utils";
import { apiClient } from "../network/api";
import * as networkUtils from "../network/utils";
import { getMockedAccount, getMockedTokenAccount } from "../test/fixtures/account.fixture";
import { getMockedConfig } from "../test/fixtures/config.fixture";
import { getMockedCurrency, getMockedHTSTokenCurrency } from "../test/fixtures/currency.fixture";
import { getMockedMirrorAccount } from "../test/fixtures/mirror.fixture";
import { getMockedOperation } from "../test/fixtures/operation.fixture";
import type { HederaAccount } from "../types";
import { getAccountShape, postSync } from "./synchronisation";

jest.mock("../config");
jest.mock("../network/api");
jest.mock("../network/utils");
jest.mock("../logic");
jest.mock("../logic/utils", () => ({
  ...jest.requireActual("../logic/utils"),
  toEVMAddress: jest.fn(),
}));
jest.mock("@ledgerhq/coin-framework/account", () => ({
  ...jest.requireActual("@ledgerhq/coin-framework/account"),
  getSyncHash: jest.fn(),
  encodeAccountId: jest.fn(),
}));

const mockEncodeAccountId = jest.mocked(coinFrameworkAccount.encodeAccountId);
const mockGetSyncHash = jest.mocked(coinFrameworkAccount.getSyncHash);
const mockHederaConfig = jest.mocked(hederaCoinConfig);
const mockToEVMAddress = jest.mocked(logicUtils.toEVMAddress);
const mockGetAccount = jest.mocked(apiClient.getAccount);
const mockGetAccountTokens = jest.mocked(apiClient.getAccountTokens);
const mockListOperationsV2 = jest.mocked(logic.listOperationsV2);
const mockGetERC20BalancesForAccountV2 = jest.mocked(networkUtils.getERC20BalancesForAccountV2);

const mockConfig = getMockedConfig();
const mockCurrency = getMockedCurrency();
const mockMirrorAccount = getMockedMirrorAccount();
const mockAddress = mockMirrorAccount.account;
const mockEvmAddress = mockMirrorAccount.evm_address;
const mockLiveAccountId = `js:2:hedera:${mockAddress}:`;
const mockSyncHash = "synchash";
const mockInfo: AccountShapeInfo<HederaAccount> = {
  currency: mockCurrency,
  derivationMode: "" as const,
  address: mockAddress,
  initialAccount: undefined,
  index: 0,
  derivationPath: "44/3030",
};

describe("getAccountShape", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockHederaConfig.getCoinConfig.mockReturnValue({ ...mockConfig, useHgraphForErc20: true });
    mockEncodeAccountId.mockReturnValue(mockLiveAccountId);
    mockGetSyncHash.mockResolvedValue(mockSyncHash);
    mockToEVMAddress.mockResolvedValue(mockEvmAddress);
    mockGetAccount.mockResolvedValue(mockMirrorAccount);
    mockGetAccountTokens.mockResolvedValue([]);
    mockGetERC20BalancesForAccountV2.mockResolvedValue([]);
    mockListOperationsV2.mockResolvedValue({
      coinOperations: [],
      tokenOperations: [],
      nextCursor: null,
    });
  });

  it("should call listOperationsV2 instead of listOperations", async () => {
    await getAccountShape(mockInfo, { paginationConfig: {} });

    expect(logic.listOperations).not.toHaveBeenCalled();
    expect(logic.listOperationsV2).toHaveBeenCalledTimes(1);
    expect(logic.listOperationsV2).toHaveBeenCalledWith(
      expect.objectContaining({ address: mockAddress, evmAddress: mockEvmAddress }),
    );
  });

  it("should call getERC20BalancesForAccountV2 instead of getERC20BalancesForAccount", async () => {
    await getAccountShape(mockInfo, { paginationConfig: {} });

    expect(mockGetERC20BalancesForAccountV2).toHaveBeenCalledTimes(1);
    expect(mockGetERC20BalancesForAccountV2).toHaveBeenCalledWith(mockAddress);
    expect(networkUtils.getERC20BalancesForAccount).not.toHaveBeenCalled();
  });

  it("should return a valid account shape", async () => {
    const result = await getAccountShape(mockInfo, { paginationConfig: {} });

    expect(result).toMatchObject({
      id: mockLiveAccountId,
      freshAddress: mockAddress,
      operations: [],
      operationsCount: 0,
    });
  });

  it("should pass cursor when initial account has existing operations (incremental sync)", async () => {
    const existingOp = { date: new Date("2024-01-01T00:00:00Z") };
    // @ts-expect-error - no other fields are needed for this test
    const initialAccount = {
      syncHash: mockSyncHash,
      operations: [existingOp],
      pendingOperations: [],
    } as Account;

    await getAccountShape({ ...mockInfo, initialAccount }, { paginationConfig: {} });

    expect(logic.listOperationsV2).toHaveBeenCalledTimes(1);
    expect(logic.listOperationsV2).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: expect.any(String) }),
    );
  });

  it("should NOT pass cursor on fresh sync", async () => {
    await getAccountShape(mockInfo, { paginationConfig: {} });

    expect(logic.listOperationsV2).toHaveBeenCalledTimes(1);
    expect(logic.listOperationsV2).toHaveBeenCalledWith(
      expect.not.objectContaining({ cursor: expect.any(String) }),
    );
  });

  it("should NOT pass cursor when syncHash has changed", async () => {
    mockGetSyncHash.mockResolvedValue("new-synchash");
    // @ts-expect-error - no other fields are needed for this test
    const initialAccount = {
      syncHash: "old-synchash",
      operations: [{ date: new Date() }],
      pendingOperations: [],
    } as Account;

    await getAccountShape({ ...mockInfo, initialAccount }, { paginationConfig: {} });

    expect(logic.listOperationsV2).toHaveBeenCalledTimes(1);
    expect(logic.listOperationsV2).toHaveBeenCalledWith(
      expect.not.objectContaining({ cursor: expect.any(String) }),
    );
  });
});

describe("postSync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHederaConfig.getCoinConfig.mockReturnValue(mockConfig);
  });

  it("should remove pending operations that match confirmed ERC20 operations", () => {
    const confirmedERC20Ops = [
      getMockedOperation({ hash: "hash1", standard: "erc20" }),
      getMockedOperation({ hash: "hash2", standard: "erc20" }),
    ];

    const initialAccount = {} as Account;
    const syncedAccount = getMockedAccount({
      operations: [...confirmedERC20Ops, getMockedOperation({ hash: "otherHash" })],
      pendingOperations: [
        getMockedOperation({ hash: "hash1" }),
        getMockedOperation({ hash: "hash2" }),
        getMockedOperation({ hash: "hash3" }),
      ],
    });

    const result = postSync(initialAccount, syncedAccount);

    expect(result.pendingOperations).toHaveLength(1);
    expect(result.pendingOperations).toMatchObject([{ hash: "hash3" }]);
  });

  it("should filter pending operations from subaccounts", () => {
    const mockToken1 = getMockedHTSTokenCurrency();

    const confirmedERC20Ops = [
      getMockedOperation({ hash: "hash1", standard: "erc20" }),
      getMockedOperation({ hash: "hash2", standard: "erc20" }),
    ];

    const subAccounts = [
      getMockedTokenAccount(mockToken1, {
        pendingOperations: [
          getMockedOperation({ hash: "hash1" }),
          getMockedOperation({ hash: "hash4" }),
        ],
      }),
      getMockedTokenAccount(mockToken1, {
        pendingOperations: [
          getMockedOperation({ hash: "hash2" }),
          getMockedOperation({ hash: "hash5" }),
        ],
      }),
    ];

    const initialAccount = {} as Account;
    const syncedAccount = getMockedAccount({
      operations: [...confirmedERC20Ops, getMockedOperation({ hash: "otherHash" })],
      subAccounts,
    });

    const result = postSync(initialAccount, syncedAccount);

    expect(result.subAccounts).toHaveLength(2);
    expect(result.subAccounts).toMatchObject([
      { pendingOperations: [{ hash: "hash4" }] },
      { pendingOperations: [{ hash: "hash5" }] },
    ]);
  });
});

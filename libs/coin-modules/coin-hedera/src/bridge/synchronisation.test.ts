import * as coinFrameworkAccount from "@ledgerhq/ledger-wallet-framework/account";
import type { AccountShapeInfo } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { Account } from "@ledgerhq/types-live";
import hederaCoinConfig from "../config";
import * as logic from "../logic";
import { apiClient } from "../network/api";
import * as networkUtils from "../network/utils";
import { getMockedConfig } from "../test/fixtures/config.fixture";
import { getMockedCurrency } from "../test/fixtures/currency.fixture";
import { getMockedMirrorAccount } from "../test/fixtures/mirror.fixture";
import type { HederaAccount } from "../types";
import { getAccountShape } from "./synchronisation";

jest.mock("../config");
jest.mock("../network/api");
jest.mock("../network/utils");
jest.mock("../logic");
jest.mock("@ledgerhq/ledger-wallet-framework/account", () => ({
  ...jest.requireActual("@ledgerhq/ledger-wallet-framework/account"),
  getSyncHash: jest.fn(),
  encodeAccountId: jest.fn(),
}));

const mockEncodeAccountId = jest.mocked(coinFrameworkAccount.encodeAccountId);
const mockGetSyncHash = jest.mocked(coinFrameworkAccount.getSyncHash);
const mockHederaConfig = jest.mocked(hederaCoinConfig);
const mockToEVMAddress = jest.mocked(networkUtils.toEVMAddress);
const mockGetAccount = jest.mocked(apiClient.getAccount);
const mockGetAccountTokens = jest.mocked(apiClient.getAccountTokens);
const mockListOperationsV2 = jest.mocked(logic.listOperationsV2);
const mockGetERC20BalancesForAccountV2 = jest.mocked(networkUtils.getERC20BalancesForAccountV2);

const mockConfig = { ...getMockedConfig() };
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

    mockHederaConfig.getCoinConfig.mockReturnValue(mockConfig);
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

  it("should call listOperationsV2 and getERC20BalancesForAccountV2", async () => {
    await getAccountShape(mockInfo, { paginationConfig: {} });

    expect(logic.listOperationsV2).toHaveBeenCalledTimes(1);
    expect(logic.listOperationsV2).toHaveBeenCalledWith(
      expect.objectContaining({ address: mockAddress, evmAddress: mockEvmAddress }),
    );
    expect(mockGetERC20BalancesForAccountV2).toHaveBeenCalledTimes(1);
    expect(mockGetERC20BalancesForAccountV2).toHaveBeenCalledWith({
      configOrCurrencyId: mockConfig,
      address: mockAddress,
    });
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

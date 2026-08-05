import * as coinFrameworkAccount from "@ledgerhq/ledger-wallet-framework/account";
import type { AccountShapeInfo } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { Account } from "@ledgerhq/types-live";
import hederaCoinConfig from "../config";
import * as logic from "../logic";
import { apiClient } from "../network/api";
import * as networkUtils from "../network/utils";
import { getMockedConfig } from "../test/fixtures/config.fixture";
import { getMockedCurrency, getMockedERC20TokenCurrency } from "../test/fixtures/currency.fixture";
import { getMockedMirrorAccount } from "../test/fixtures/mirror.fixture";
import type { HederaAccount } from "../types";
import { getAccountShape, buildIterateResult } from "./synchronisation";
import * as bridgeUtils from "./utils";

jest.mock("../config");
jest.mock("../network/api");
jest.mock("../network/utils");
jest.mock("../logic");
jest.mock("@ledgerhq/ledger-wallet-framework/account", () => ({
  ...jest.requireActual("@ledgerhq/ledger-wallet-framework/account"),
  getSyncHash: jest.fn(),
  encodeAccountId: jest.fn(),
}));
jest.mock("./utils", () => ({
  ...jest.requireActual("./utils"),
  buildCalTokenMap: jest.fn(),
}));

const mockEncodeAccountId = jest.mocked(coinFrameworkAccount.encodeAccountId);
const mockGetSyncHash = jest.mocked(coinFrameworkAccount.getSyncHash);
const mockHederaConfig = jest.mocked(hederaCoinConfig);
const mockToEVMAddress = jest.mocked(networkUtils.toEVMAddress);
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

const mockBuildCalTokenMap = jest.mocked(bridgeUtils.buildCalTokenMap);

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
    mockBuildCalTokenMap.mockResolvedValue(new Map());
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

  it("passes ERC20 token contractAddresses to listOperationsV2 tokenEvmAddresses", async () => {
    const erc20Token = getMockedERC20TokenCurrency();
    const erc20Address = erc20Token.contractAddress.toLowerCase();
    mockBuildCalTokenMap.mockResolvedValueOnce(new Map([[erc20Address, erc20Token as never]]));

    await getAccountShape(mockInfo, { paginationConfig: {} });

    expect(logic.listOperationsV2).toHaveBeenCalledWith(
      expect.objectContaining({
        tokenEvmAddresses: expect.arrayContaining([erc20Address]),
      }),
    );
  });

  it("uses ?? [] fallback when initialAccount pendingOperations is undefined", async () => {
    mockGetSyncHash.mockResolvedValue(mockSyncHash);
    // @ts-expect-error - partial account for testing ?? [] branch
    const initialAccount = {
      syncHash: mockSyncHash,
      operations: undefined,
      pendingOperations: undefined,
    } as Account;

    const result = await getAccountShape({ ...mockInfo, initialAccount }, { paginationConfig: {} });

    expect(result.operations).toEqual([]);
  });

  it("populates delegation when staked_node_id is a number", async () => {
    mockGetAccount.mockResolvedValue(
      getMockedMirrorAccount({ staked_node_id: 5, pending_reward: 1000 }),
    );

    const result = await getAccountShape(mockInfo, { paginationConfig: {} });

    const hederaResources = (result as { hederaResources?: unknown }).hederaResources as {
      delegation: unknown;
    } | null;
    expect(hederaResources?.delegation).toMatchObject({ nodeId: 5 });
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

describe("buildIterateResult", () => {
  const mockGetAccountsForPublicKey = jest.mocked(apiClient.getAccountsForPublicKey);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns address result for an index within bounds", async () => {
    mockGetAccountsForPublicKey.mockResolvedValue([
      { account: "0.0.1234" },
      { account: "0.0.5678" },
    ] as never);

    const iterateFn = await buildIterateResult({ result: { publicKey: "pubkey" } } as never);
    const result = await iterateFn({
      currency: mockCurrency,
      derivationMode: "" as const,
      index: 0,
    } as never);

    expect(result).toEqual(
      expect.objectContaining({
        address: "0.0.1234",
        publicKey: "0.0.1234",
      }),
    );
  });

  it("returns result for the second account when index is 1", async () => {
    mockGetAccountsForPublicKey.mockResolvedValue([
      { account: "0.0.1234" },
      { account: "0.0.5678" },
    ] as never);

    const iterateFn = await buildIterateResult({ result: { publicKey: "pubkey" } } as never);
    const result = await iterateFn({
      currency: mockCurrency,
      derivationMode: "" as const,
      index: 1,
    } as never);

    expect(result).toEqual(
      expect.objectContaining({
        address: "0.0.5678",
        publicKey: "0.0.5678",
      }),
    );
  });

  it("returns null when index is out of bounds", async () => {
    mockGetAccountsForPublicKey.mockResolvedValue([{ account: "0.0.1234" }] as never);

    const iterateFn = await buildIterateResult({ result: { publicKey: "pubkey" } } as never);
    const result = await iterateFn({
      currency: mockCurrency,
      derivationMode: "" as const,
      index: 5,
    } as never);

    expect(result).toBeNull();
  });

  it("calls getAccountsForPublicKey with the rootResult publicKey", async () => {
    mockGetAccountsForPublicKey.mockResolvedValue([] as never);

    const iterateFn = await buildIterateResult({
      result: { publicKey: "root-public-key" },
    } as never);
    await iterateFn({ currency: mockCurrency, derivationMode: "" as const, index: 0 } as never);

    expect(mockGetAccountsForPublicKey).toHaveBeenCalledTimes(1);
    expect(mockGetAccountsForPublicKey).toHaveBeenCalledWith(
      expect.objectContaining({ publicKey: "root-public-key" }),
    );
  });
});

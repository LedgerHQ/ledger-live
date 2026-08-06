import { SyncConfig } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { fetchBalance, fetchLastBlock, fetchAccountStateInfo, fetchTxs } from "../network/api";
import { createMockAccountShapeData } from "../__tests__/fixtures";
import { getAccountShape } from "./sync";
import { mapTxToOps } from "../logic/listOperations";

// Mock dependencies
jest.mock("../network/api");
jest.mock("../logic/listOperations");

describe("getAccountShape", () => {
  const {
    mockAddress,
    mockAccountInfo,
    mockAccountId,
    mockBlockHeight,
    mockPurseUref,
    mockAccountHash,
    mockBalance,
    mockTxs,
    mockOperations,
  } = createMockAccountShapeData();

  const mockSyncConfig: SyncConfig = {
    paginationConfig: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (fetchAccountStateInfo as jest.Mock).mockResolvedValue({
      purseUref: mockPurseUref,
      accountHash: mockAccountHash,
    });

    (fetchLastBlock as jest.Mock).mockResolvedValue({
      height: mockBlockHeight,
      hash: "0xmockhash",
      time: new Date(),
    });

    (fetchBalance as jest.Mock).mockResolvedValue(mockBalance);

    (fetchTxs as jest.Mock).mockResolvedValue(mockTxs);

    (mapTxToOps as jest.Mock).mockImplementation(() => () => mockOperations);
  });

  test("should return the correct account shape for an account with balance", async () => {
    const accountShape = await getAccountShape(mockAccountInfo, mockSyncConfig);

    expect(fetchAccountStateInfo).toHaveBeenCalledWith(mockAddress);
    expect(fetchLastBlock).toHaveBeenCalled();
    expect(fetchBalance).toHaveBeenCalledWith(mockPurseUref);
    expect(fetchTxs).toHaveBeenCalledWith(mockAddress);
    expect(mapTxToOps).toHaveBeenCalledWith(mockAccountId, mockAccountHash);

    expect(accountShape).toEqual({
      id: mockAccountId,
      balance: mockBalance,
      spendableBalance: mockBalance,
      operations: mockOperations,
      blockHeight: mockBlockHeight,
    });
  });

  test("should return account with zero balance when purseUref is not found", async () => {
    (fetchAccountStateInfo as jest.Mock).mockResolvedValue({
      purseUref: undefined,
      accountHash: mockAccountHash,
    });

    const accountShape = await getAccountShape(mockAccountInfo, mockSyncConfig);

    expect(fetchAccountStateInfo).toHaveBeenCalledWith(mockAddress);
    expect(fetchLastBlock).toHaveBeenCalled();
    expect(fetchBalance).not.toHaveBeenCalled();
    expect(fetchTxs).not.toHaveBeenCalled();

    expect(accountShape).toEqual({
      id: mockAccountId,
      balance: new BigNumber(0),
      spendableBalance: new BigNumber(0),
      operations: [],
      blockHeight: mockBlockHeight,
    });
  });

  test("should return account with operations even when accountHash is not found", async () => {
    (fetchAccountStateInfo as jest.Mock).mockResolvedValue({
      purseUref: mockPurseUref,
      accountHash: undefined,
    });

    const accountShape = await getAccountShape(mockAccountInfo, mockSyncConfig);

    expect(fetchAccountStateInfo).toHaveBeenCalledWith(mockAddress);
    expect(fetchLastBlock).toHaveBeenCalled();
    expect(fetchBalance).toHaveBeenCalledWith(mockPurseUref);
    expect(fetchTxs).toHaveBeenCalledWith(mockAddress);
    expect(mapTxToOps).toHaveBeenCalledWith(mockAccountId, "");

    expect(accountShape).toEqual({
      id: mockAccountId,
      balance: mockBalance,
      spendableBalance: mockBalance,
      operations: mockOperations,
      blockHeight: mockBlockHeight,
    });
  });

  test("should handle API errors appropriately", async () => {
    const errorMessage = "API Error";
    (fetchAccountStateInfo as jest.Mock).mockRejectedValue(new Error(errorMessage));

    await expect(getAccountShape(mockAccountInfo, mockSyncConfig)).rejects.toThrow(errorMessage);

    expect(fetchAccountStateInfo).toHaveBeenCalledWith(mockAddress);
    expect(fetchLastBlock).not.toHaveBeenCalled();
    expect(fetchBalance).not.toHaveBeenCalled();
    expect(fetchTxs).not.toHaveBeenCalled();
  });
});

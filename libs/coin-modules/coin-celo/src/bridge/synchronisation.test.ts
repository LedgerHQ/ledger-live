import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import BigNumber from "bignumber.js";
import { lockedGold, nonVoting, electionConfig } from "./__mocks__/celokit.mock";
import { mockCreateApi, erc20Operation, nativeOperation } from "./__mocks__/operations-list.mock";
import { mockGetCoinBalance, mockTokenEvmLogic } from "./__mocks__/evm.mock";
import { getAccountShape } from "./synchronisation";

const defaultInfo = {
  address: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
  currency: getCryptoCurrencyById("celo"),
  index: 0,
  derivationPath: "44'/52752'/0'",
  derivationMode: "",
  initialAccount: undefined,
} as const;
const defaultConfig = { blacklistedTokenIds: [], paginationConfig: {} };

const defaultShape = {
  balance: new BigNumber(1010),
  spendableBalance: new BigNumber(20),
  operations: [],
  subAccounts: [],
  blockHeight: 100,
  syncHash: "0x000000000",
  id: "celo:2:0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
};

lockedGold.mockResolvedValue(new BigNumber(0));
nonVoting.mockResolvedValue(new BigNumber(0));
electionConfig.mockResolvedValue({ maxNumGroupsVotedFor: 10 });

describe("When getting the account shape", () => {
  it("returns the account with correct balance and spendable balance", async () => {
    // Given
    mockCreateApi.mockReturnValue({
      listOperations: jest.fn().mockResolvedValueOnce([[]]),
      lastBlock: jest.fn().mockResolvedValueOnce({ height: 4444 }),
    });
    mockGetCoinBalance.mockResolvedValueOnce(new BigNumber(1010));

    // When
    const result = await getAccountShape(defaultInfo, defaultConfig);

    // Then
    expect(result).toMatchObject({
      balance: BigNumber(1010),
      spendableBalance: BigNumber(1010),
    });
  });

  it("returns the account with 0 operations", async () => {
    // Given
    mockCreateApi.mockReturnValue({
      listOperations: jest.fn().mockResolvedValueOnce([[]]),
      lastBlock: jest.fn().mockResolvedValueOnce({ height: 4444 }),
    });
    mockGetCoinBalance.mockResolvedValueOnce(new BigNumber(1010));

    // When
    const result = await getAccountShape(defaultInfo, defaultConfig);

    // Then
    expect(result).toMatchObject({
      blockHeight: 4444,
      syncHash: "0x0000000000000000000000000000000000001d00",
    });
    expect(result.operations?.length).toBe(0);
  });

  it("returns the account with 1 erc20 operation", async () => {
    mockCreateApi.mockReturnValue({
      listOperations: jest.fn().mockResolvedValueOnce([[erc20Operation]]),
      lastBlock: jest.fn().mockResolvedValueOnce({ height: 4444 }),
    });
    // Given
    mockTokenEvmLogic.mockResolvedValueOnce({ ticker: "USDC", id: "0xcc" });
    mockGetCoinBalance.mockResolvedValueOnce(new BigNumber(1010));

    // When
    const result = await getAccountShape(defaultInfo, defaultConfig);

    // Then
    expect(result).toMatchObject({
      blockHeight: 4444,
      celoResources: {
        registrationStatus: false,
        pendingWithdrawals: [],
      },
    });
    expect(result.operations?.length).toBe(0);
    expect(result.subAccounts?.length).toBe(1);
  });

  it("returns the account with 1 native operation", async () => {
    // Given
    mockCreateApi.mockReturnValue({
      listOperations: jest.fn().mockResolvedValueOnce([[nativeOperation]]),
      lastBlock: jest.fn().mockResolvedValueOnce({ height: 4444 }),
    });
    mockGetCoinBalance.mockResolvedValueOnce(new BigNumber(1010));

    // When
    const result = await getAccountShape(defaultInfo, defaultConfig);

    // Then
    expect(result).toMatchObject({
      blockHeight: 4444,
      operationsCount: 1,
    });
    expect(result.operations?.length).toBe(1);
  });

  it("returns the account with correct id, and celo resources", async () => {
    // Given
    mockCreateApi.mockReturnValue({
      listOperations: jest.fn().mockResolvedValueOnce([[nativeOperation]]),
      lastBlock: jest.fn().mockResolvedValueOnce({ height: 4444 }),
    });
    mockGetCoinBalance.mockResolvedValueOnce(new BigNumber(20));

    // When
    const result = await getAccountShape(defaultInfo, defaultConfig);

    // Then
    expect(result).toBeDefined();
    expect(result).toMatchObject({
      id: "js:2:celo:0x79D5A290D7ba4b99322d91b577589e8d0BF87072:",
      celoResources: {
        electionAddress: "0x000000000000000000000000000000000000ce10",
        lockedGoldAddress: "0x0000000000000000000000000000000000001d00",
      },
    });
    expect(result.spendableBalance).toEqual(BigNumber(20));
  });
});

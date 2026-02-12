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

lockedGold.mockResolvedValue(new BigNumber(0));
nonVoting.mockResolvedValue(new BigNumber(0));
electionConfig.mockResolvedValue({ maxNumGroupsVotedFor: 10 });

describe("When getting the account shape", () => {
  it("returns the account with correct balance and spendable balance", async () => {
    // Given
    mockCreateApi.mockReturnValue({
      listOperations: jest.fn().mockResolvedValueOnce({ items: [] }),
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
      listOperations: jest.fn().mockResolvedValueOnce({ items: [] }),
      lastBlock: jest.fn().mockResolvedValueOnce({ height: 4444 }),
    });
    mockGetCoinBalance.mockResolvedValueOnce(new BigNumber(1010));

    // When
    const result = await getAccountShape(defaultInfo, defaultConfig);

    // Then
    expect(result).toMatchObject({
      blockHeight: 4444,
      syncHash: "0x0000000000000000000000000000000000001d00",
      operations: [],
    });
  });

  it("returns the account with 1 erc20 operation", async () => {
    mockCreateApi.mockReturnValue({
      listOperations: jest.fn().mockResolvedValueOnce({ items: [erc20Operation] }),
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
      operations: [],
      subAccounts: [
        {
          balance: undefined,
          balanceHistoryCache: {
            DAY: {
              balances: [],
              latestDate: null,
            },
            HOUR: {
              balances: [],
              latestDate: null,
            },
            WEEK: {
              balances: [],
              latestDate: null,
            },
          },
          creationDate: new Date("2026-01-09"),
          id: "js:2:celo:0x79D5A290D7ba4b99322d91b577589e8d0BF87072:+0xcc",
          operations: [
            {
              id: "js:2:celo:address",
              hash: "0xs",
              type: "UNLOCK",
              value: new BigNumber(200000000000000000000),
              senders: ["0x5a40FEE4eFebE3c85eDD3C79E15e221B7261a000"],
              recipients: ["0x0000000000000000000000000000000000001d00"],
              blockHeight: 2000,
              blockHash: "0xsa",
              accountId: "js:2:celo:0x79D5A290D7ba4b99322d91b577589e8d0BF87072:+0xcc",
              date: new Date("2026-01-09"),
              hasFailed: false,
              fee: new BigNumber(525072996210000),
              transactionSequenceNumber: new BigNumber(0),
              extra: {},
              isSubAccount: true,
            },
          ],
        },
      ],
      celoResources: {
        registrationStatus: true,
        pendingWithdrawals: [],
      },
    });
  });

  it("returns the account with 1 native operation", async () => {
    // Given
    mockCreateApi.mockReturnValue({
      listOperations: jest.fn().mockResolvedValueOnce({ items: [nativeOperation] }),
      lastBlock: jest.fn().mockResolvedValueOnce({ height: 4444 }),
    });
    mockGetCoinBalance.mockResolvedValueOnce(new BigNumber(1010));

    // When
    const result = await getAccountShape(defaultInfo, defaultConfig);

    // Then
    expect(result).toMatchObject({
      blockHeight: 4444,
      operationsCount: 1,
      operations: [
        {
          id: "js:2:celo:address",
          hash: "0xs",
          type: "OUT",
          value: new BigNumber(0),
          senders: ["0x5a40FEE4eFebE3c85eDD3C79E15e221B7261a000"],
          recipients: ["0x5a40FEE4eFebE3c85eDD3C79E15e221B7261a000"],
          blockHeight: 2000,
          blockHash: "0xsa",
          accountId: "js:2:celo:0x79D5A290D7ba4b99322d91b577589e8d0BF87072:",
          date: new Date("2026-01-09"),
          hasFailed: false,
          fee: new BigNumber(525072996210000),
          transactionSequenceNumber: new BigNumber(0),
          extra: {},
          isSubAccount: false,
        },
      ],
    });
  });

  it("returns the account with correct id, and celo resources", async () => {
    // Given
    mockCreateApi.mockReturnValue({
      listOperations: jest.fn().mockResolvedValueOnce({ items: [nativeOperation] }),
      lastBlock: jest.fn().mockResolvedValueOnce({ height: 4444 }),
    });
    mockGetCoinBalance.mockResolvedValueOnce(new BigNumber(20));

    // When
    const result = await getAccountShape(defaultInfo, defaultConfig);

    // Then
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

import { faker } from "@faker-js/faker";
import { createEmptyHistoryCache } from "@ledgerhq/coin-framework/account";
import { makeScanAccounts } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getCryptoCurrencyById, getTokenById } from "@ledgerhq/cryptoassets";
import BigNumber from "bignumber.js";
import { setupServer } from "msw/node";
import { firstValueFrom } from "rxjs";
import { getAccountShape } from "./synchronisation";
import { Operation } from "@ledgerhq/types-live";

const mockGetAccount = jest.fn();
const mockGetOperations = jest.fn();
const mockGetTokenOperations = jest.fn();
const mockGetLastBlockHeight = jest.fn();

jest.mock("../network", () => {
  return {
    getAccount: () => mockGetAccount(),
    getLastBlockHeight: () => mockGetLastBlockHeight(),
    getOperations: () => mockGetOperations(),
    getTokenOperations: () => mockGetTokenOperations(),
  };
});

describe("scanAccounts", () => {
  const syncConfig = {
    paginationConfig: {},
  };
  const deviceId = "deviceId";
  const currency = getCryptoCurrencyById("vechain");

  beforeAll(() => {
    setupServer().listen({ onUnhandledRequest: "error" });
  });

  beforeEach(() => {
    mockGetAccount.mockClear();
    mockGetLastBlockHeight.mockClear();
    mockGetOperations.mockClear();
    mockGetTokenOperations.mockClear();
  });

  it("returns the account info and its subaccount", async () => {
    // Given
    const blockHeight = 0;
    const address = "0x5066118c66793ED86bd379b50b20E32B0FC1aBf5";
    const addressResolver = {
      address,
      path: "path",
      publicKey: "publicKey",
    };
    mockGetAccount.mockResolvedValueOnce({ balance: "0", energy: "0" });
    mockGetLastBlockHeight.mockResolvedValueOnce(blockHeight);
    mockGetOperations.mockResolvedValueOnce([]);
    mockGetTokenOperations.mockResolvedValueOnce([]);

    // When
    const scanAccounts = makeScanAccounts({
      getAccountShape,
      getAddressFn: (_deviceId, _addressOpt) => Promise.resolve(addressResolver),
    });
    const result = await firstValueFrom(
      scanAccounts({
        currency,
        deviceId,
        syncConfig,
      }),
    );

    // Then
    expect(result).toEqual({
      account: {
        id: "js:2:vechain:0x5066118c66793ED86bd379b50b20E32B0FC1aBf5:vechain",
        balance: new BigNumber("0"),
        balanceHistoryCache: {
          HOUR: {
            latestDate: expect.any(Number),
            balances: [],
          },
          DAY: {
            latestDate: expect.any(Number),
            balances: [],
          },
          WEEK: {
            latestDate: expect.any(Number),
            balances: [],
          },
        },
        blockHeight,
        creationDate: expect.any(Date),
        currency,
        derivationMode: "vechain",
        freshAddress: addressResolver.address,
        freshAddressPath: addressResolver.path,
        index: 0,
        lastSyncDate: expect.any(Date),
        operations: [],
        operationsCount: 0,
        pendingOperations: [],
        seedIdentifier: addressResolver.publicKey,
        spendableBalance: new BigNumber("0"),
        swapHistory: [],
        type: "Account",
        used: false,
        feesCurrency: getTokenById("vechain/vip180/vtho"),
        subAccounts: [
          {
            type: "TokenAccount",
            id: "js:2:vechain:0x5066118c66793ED86bd379b50b20E32B0FC1aBf5:vechain+vechain%2Fvip180%2Fvtho",
            parentId: "js:2:vechain:0x5066118c66793ED86bd379b50b20E32B0FC1aBf5:vechain",
            token: getTokenById("vechain/vip180/vtho"),
            balance: new BigNumber("0"),
            spendableBalance: new BigNumber("0"),
            creationDate: expect.any(Date),
            operationsCount: 0,
            operations: [],
            blockHeight,
            pendingOperations: [],
            balanceHistoryCache: createEmptyHistoryCache(),
            swapHistory: [],
          },
        ],
      },
      type: "discovered",
    });
  });

  it("returns the balance in the main account and the energy in the subAccount", async () => {
    // Given
    const address = "0x5066118c66793ED86bd379b50b20E32B0FC1aBf5";
    const addressResolver = {
      address,
      path: "path",
      publicKey: "publicKey",
    };
    const balance = new BigNumber(faker.number.int({ min: 100_000, max: 1_000_000 }));
    const energy = new BigNumber(faker.number.int({ min: 100_000, max: 1_000_000 }));
    mockGetAccount.mockResolvedValueOnce({ balance, energy });
    mockGetOperations.mockResolvedValueOnce([]);
    mockGetTokenOperations.mockResolvedValueOnce([]);

    // When
    const scanAccounts = makeScanAccounts({
      getAccountShape,
      getAddressFn: (_deviceId, _addressOpt) => Promise.resolve(addressResolver),
    });
    const { account } = await firstValueFrom(
      scanAccounts({
        currency,
        deviceId,
        syncConfig,
      }),
    );

    // Then
    expect(account.balance).toEqual(balance);
    expect(account.spendableBalance).toEqual(balance);
    expect(account.subAccounts![0].balance).toEqual(energy);
    expect(account.subAccounts![0].spendableBalance).toEqual(energy);
  });

  it.each([
    {
      balance: "100000",
      energy: "0",
      operations: [] as unknown as Operation,
    },
    {
      balance: "0",
      energy: "100000",
      operations: [] as unknown as Operation,
    },
    {
      balance: "0",
      energy: "0",
      operations: [
        {
          date: faker.date.recent(),
        },
      ] as unknown as Operation,
    },
  ])("returns the account flagged as used", async ({ balance, energy, operations }) => {
    // Given
    const address = "0x5066118c66793ED86bd379b50b20E32B0FC1aBf5";
    const addressResolver = {
      address,
      path: "path",
      publicKey: "publicKey",
    };
    mockGetAccount.mockResolvedValueOnce({ balance, energy });
    mockGetOperations.mockResolvedValueOnce(operations);
    mockGetTokenOperations.mockResolvedValueOnce([]);

    // When
    const scanAccounts = makeScanAccounts({
      getAccountShape,
      getAddressFn: (_deviceId, _addressOpt) => Promise.resolve(addressResolver),
    });
    const { account } = await firstValueFrom(
      scanAccounts({
        currency,
        deviceId,
        syncConfig,
      }),
    );

    // Then
    expect(account.used).toBeTruthy();
  });
});

import { faker } from "@faker-js/faker";
import { createEmptyHistoryCache } from "@ledgerhq/coin-framework/account";
import { makeScanAccounts } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { getCryptoAssetsStore } from "@ledgerhq/coin-framework/crypto-assets/index";
import { initializeLegacyTokens } from "@ledgerhq/cryptoassets/legacy/legacy-data";
import { addTokens } from "@ledgerhq/cryptoassets/legacy/legacy-utils";
import BigNumber from "bignumber.js";
import { setupServer } from "msw/node";
import { firstValueFrom } from "rxjs";
import { getAccountShape } from "./synchronisation";
import { Operation } from "@ledgerhq/types-live";

jest.mock("@ledgerhq/coin-framework/crypto-assets/index");

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
    // Initialize legacy tokens
    initializeLegacyTokens(addTokens);

    // Mock the crypto assets store
    const vthoToken = {
      type: "TokenCurrency",
      id: "vechain/vip180/vtho",
      contractAddress: "0x0000000000000000000000000000456E65726779",
      parentCurrency: {
        type: "CryptoCurrency",
        id: "vechain",
        coinType: 818,
        name: "Vechain",
        managerAppName: "VeChain",
        ticker: "VET",
        scheme: "vechain",
        color: "#82BE00",
        family: "vechain",
        blockAvgTime: 10,
        tokenTypes: ["vip180"],
        units: [
          { name: "VET", code: "VET", magnitude: 18 },
          { name: "Gwei", code: "Gwei", magnitude: 9 },
          { name: "Mwei", code: "Mwei", magnitude: 6 },
          { name: "Kwei", code: "Kwei", magnitude: 3 },
          { name: "wei", code: "wei", magnitude: 0 },
        ],
        explorerViews: [
          {
            tx: "https://explore.vechain.org/transactions/$hash",
            address: "https://explore.vechain.org/accounts/$address",
          },
        ],
      },
      tokenType: "vip180",
      name: "Vethor",
      ticker: "VTHO",
      disableCountervalue: false,
      units: [{ name: "Vethor", code: "VTHO", magnitude: 18 }],
    };

    (getCryptoAssetsStore as jest.Mock).mockReturnValue({
      findTokenById: jest.fn().mockImplementation((id: string) => {
        if (id === "vechain/vip180/vtho") {
          return Promise.resolve(vthoToken);
        }
        return Promise.resolve(null);
      }),
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(null),
    });

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

    // Get the token asynchronously
    const vthoToken = await getCryptoAssetsStore().findTokenById("vechain/vip180/vtho");

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
        feesCurrency: vthoToken,
        subAccounts: [
          {
            type: "TokenAccount",
            id: "js:2:vechain:0x5066118c66793ED86bd379b50b20E32B0FC1aBf5:vechain+vechain%2Fvip180%2Fvtho",
            parentId: "js:2:vechain:0x5066118c66793ED86bd379b50b20E32B0FC1aBf5:vechain",
            token: vthoToken,
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
    expect(account).toMatchObject({
      balance,
      spendableBalance: balance,
      subAccounts: [
        {
          balance: energy,
          spendableBalance: energy,
        },
      ],
    });
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
    expect(account.used).toBe(true);
  });
});

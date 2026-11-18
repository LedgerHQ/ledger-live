import { createEmptyHistoryCache } from "@ledgerhq/ledger-wallet-framework/account";
import { makeScanAccounts } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import {
  CryptoCurrencyIdSchema,
  TokenCurrencyIdSchema,
  type TokenCurrency,
} from "@ledgerhq/ledger-wallet-framework/types";
import BigNumber from "bignumber.js";
import { setupServer } from "msw/node";
import { firstValueFrom } from "rxjs";
import { getAccountShape } from "./synchronisation";
import { Account, Operation } from "@ledgerhq/types-live";

const mockGetAccount = jest.fn();
const mockGetOperations = jest.fn();
const mockGetTokenOperations = jest.fn();
const mockGetLastBlockHeight = jest.fn();

jest.mock("../network", () => {
  return {
    getAccount: () => mockGetAccount(),
    getLastBlockHeight: () => mockGetLastBlockHeight(),
    getOperations: (...args: unknown[]) => mockGetOperations(...args),
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
    const vthoToken: TokenCurrency = {
      type: "TokenCurrency",
      id: TokenCurrencyIdSchema.parse("vechain/vip180/vtho"),
      contractAddress: "0x0000000000000000000000000000456E65726779",
      parentCurrencyId: CryptoCurrencyIdSchema.parse("vechain"),
      tokenType: "vip180",
      name: "VeThor",
      ticker: "VTHO",
      delisted: false,
      disableCountervalue: false,
      units: [{ name: "VeThor", code: "VTHO", magnitude: 18 }],
    };

    setCryptoAssetsStore({
      findTokenById: async (id: string) => {
        if (id === "vechain/vip180/vtho") {
          return vthoToken;
        }
        return undefined;
      },
      findTokenByAddressInCurrency: async () => undefined,
      getTokensSyncHash: async () => "",
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
    const balance = new BigNumber(500_000);
    const energy = new BigNumber(750_000);
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
          date: new Date("2024-01-01"),
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

  it("requests the operations after the newest stored one and merges them with the stored ones", async () => {
    const address = "0x5066118c66793ED86bd379b50b20E32B0FC1aBf5";
    const makeOperation = (id: string, blockHeight: number, date: string): Operation =>
      ({
        id,
        hash: id,
        type: "IN",
        value: new BigNumber(1),
        fee: new BigNumber(0),
        blockHeight,
        date: new Date(date),
        senders: [],
        recipients: [],
        accountId: "js:2:vechain:0x5066118c66793ED86bd379b50b20E32B0FC1aBf5:vechain",
        extra: {},
      }) as unknown as Operation;
    const newest = makeOperation("newest", 200, "2024-02-01");
    const oldest = makeOperation("oldest", 100, "2024-01-01");
    const fetched = makeOperation("fetched", 300, "2024-03-01");
    mockGetAccount.mockResolvedValueOnce({ balance: "0", energy: "0" });
    mockGetLastBlockHeight.mockResolvedValueOnce(400);
    mockGetOperations.mockResolvedValueOnce([fetched]);
    mockGetTokenOperations.mockResolvedValueOnce([]);

    const shape = await getAccountShape(
      {
        currency,
        derivationMode: "vechain",
        address,
        index: 0,
        initialAccount: { operations: [newest, oldest] } as unknown as Account,
      } as Parameters<typeof getAccountShape>[0],
      syncConfig as Parameters<typeof getAccountShape>[1],
    );

    expect(mockGetOperations).toHaveBeenCalledWith(
      expect.anything(),
      "js:2:vechain:0x5066118c66793ED86bd379b50b20E32B0FC1aBf5:vechain",
      address,
      201,
      400,
    );
    expect(shape.operations?.map(operation => operation.id)).toEqual([
      "fetched",
      "newest",
      "oldest",
    ]);
    expect(shape.operationsCount).toEqual(3);
  });
});

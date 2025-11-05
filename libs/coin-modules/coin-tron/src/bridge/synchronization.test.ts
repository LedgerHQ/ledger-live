import { makeScanAccounts } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { Account, AccountBridge, SyncConfig, TransactionCommon } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { firstValueFrom, reduce } from "rxjs";
import coinConfig, { TronCoinConfig } from "../config";
import * as tronNetwork from "../network";
import { mockServer, TRONGRID_BASE_URL_MOCKED } from "../network/index.mock";
import { Transaction, TronAccount } from "../types";
import accountFixture from "./fixtures/synchronization.account.fixture.json";
import { createBridges } from "./index";
import { getAccountShape } from "./synchronization";
import { setupServer } from "msw/node";
import { AccountTronAPI } from "../network/types";
import { getCryptoAssetsStore } from "@ledgerhq/coin-framework/crypto-assets/index";

jest.mock("@ledgerhq/coin-framework/crypto-assets/index");

const currency = getCryptoCurrencyById("tron");
const defaultSyncConfig = {
  paginationConfig: {},
};
function syncAccount<T extends TransactionCommon, A extends Account = Account>(
  bridge: AccountBridge<T, A>,
  account: A,
  syncConfig: SyncConfig = defaultSyncConfig,
): Promise<A> {
  return firstValueFrom(
    bridge.sync(account, syncConfig).pipe(reduce((a, f: (arg0: A) => A) => f(a), account)),
  );
}

const dummyAccount: TronAccount = {
  type: "Account",
  id: "",
  derivationMode: "",
  seedIdentifier: "",
  used: false,
  currency,
  index: 0,
  freshAddress: "",
  freshAddressPath: "",
  swapHistory: [],
  blockHeight: 0,
  balance: new BigNumber(0),
  spendableBalance: new BigNumber(0),
  operationsCount: 0,
  operations: [],
  pendingOperations: [],
  lastSyncDate: new Date(0),
  creationDate: new Date(),
  balanceHistoryCache: {
    HOUR: {
      balances: [],
      latestDate: undefined,
    },
    DAY: {
      balances: [],
      latestDate: undefined,
    },
    WEEK: {
      balances: [],
      latestDate: undefined,
    },
  },
  tronResources: {} as any,
};

const reviver = (key: string, value: unknown) => {
  // Format date
  if (
    [
      "date",
      "creationDate",
      "expiredAt",
      "lastVotedDate",
      "lastWithdrawnRewardDate",
      // "latestDate",
    ].includes(key) === true
  ) {
    return value !== null
      ? typeof value === "string"
        ? new Date(value as string)
        : new Date(value as number)
      : new Date("1970-01-01T00:00:00.000Z");
  }

  // BigNumber conversion
  if (
    [
      "unwithdrawnReward",
      "amount",
      "balance",
      "spendableBalance",
      "freeLimit",
      "freeUsed",
      "gainedLimit",
      "gainedUsed",
      "value",
      "frozenAmount",
      "unfreezeAmount",
      "energy",
      "fee",
    ].includes(key) === true
  ) {
    return typeof value === "string" ? new BigNumber(value as string) : value;
  }
  // Remove undesired properties as they always change
  //FIXME: balanceHistoryCache
  if (["lastSyncDate", "latestDate", "balanceHistoryCache"].includes(key) === true) {
    return undefined;
  }

  return value;
};

describe("sync", () => {
  let bridge: ReturnType<typeof createBridges>;

  beforeAll(() => {
    // Mock the crypto assets store with the expected tokens
    const parentCurrency = {
      type: "CryptoCurrency",
      id: "tron",
      coinType: 195,
      name: "Tron",
      managerAppName: "Tron",
      ticker: "TRX",
      scheme: "tron",
      color: "#D9012C",
      family: "tron",
      blockAvgTime: 9,
      units: [{ name: "TRX", code: "TRX", magnitude: 6 }],
      explorerViews: [
        {
          tx: "https://tronscan.org/#/transaction/$hash",
          address: "https://tronscan.org/#/address/$address",
        },
      ],
      keywords: ["trx", "tron"],
    };

    const mockTokens = {
      "tron/trc10/1002000": {
        type: "TokenCurrency",
        id: "tron/trc10/1002000",
        contractAddress: "TF5Bn4cJCT6GVeUgyCN4rBhDg42KBrpAjg",
        parentCurrency,
        tokenType: "trc10",
        name: "BitTorrent Old",
        ticker: "BTTOLD",
        delisted: true,
        disableCountervalue: false,
        ledgerSignature:
          "0a0a426974546f7272656e7410061a46304402202e2502f36b00e57be785fc79ec4043abcdd4fdd1b58d737ce123599dffad2cb602201702c307f009d014a553503b499591558b3634ceee4c054c61cedd8aca94c02b",
        units: [{ name: "BitTorrent Old", code: "BTTOLD", magnitude: 6 }],
      },
      "tron/trc20/tla2f6vpqdgre67v1736s7bj8ray5wyju7": {
        type: "TokenCurrency",
        id: "tron/trc20/tla2f6vpqdgre67v1736s7bj8ray5wyju7",
        contractAddress: "TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7",
        parentCurrency,
        tokenType: "trc20",
        name: "WINK",
        ticker: "WIN",
        delisted: false,
        disableCountervalue: false,
        ledgerSignature: null,
        units: [{ name: "WINK", code: "WIN", magnitude: 6 }],
      },
      "tron/trc20/tcfll5dx5zjdknwuesxxi1vpwjlvmwzzy9": {
        type: "TokenCurrency",
        id: "tron/trc20/tcfll5dx5zjdknwuesxxi1vpwjlvmwzzy9",
        contractAddress: "TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9",
        parentCurrency,
        tokenType: "trc20",
        name: "JUST GOV",
        ticker: "JST",
        delisted: false,
        disableCountervalue: false,
        ledgerSignature: null,
        units: [{ name: "JUST GOV", code: "JST", magnitude: 18 }],
      },
    };

    (getCryptoAssetsStore as jest.Mock).mockReturnValue({
      findTokenById: jest.fn().mockImplementation((id: string) => {
        return Promise.resolve(mockTokens[id as keyof typeof mockTokens] || null);
      }),
      findTokenByAddressInCurrency: jest
        .fn()
        .mockImplementation((address: string, currencyId: string) => {
          if (currencyId === "tron") {
            const token = Object.values(mockTokens).find(
              token => token.contractAddress.toLowerCase() === address.toLowerCase(),
            );
            return Promise.resolve(token || null);
          }
          return Promise.resolve(null);
        }),
    });

    const signer = jest.fn();
    const coinConfig = (): TronCoinConfig => ({
      status: {
        type: "active",
      },
      explorer: {
        url: TRONGRID_BASE_URL_MOCKED,
      },
    });
    bridge = createBridges(signer, coinConfig);

    mockServer.listen({ onUnhandledRequest: "error" });
  });

  afterAll(() => {
    mockServer.close();
  });

  it.each([
    {
      id: "TL24LCps5FKwp3PoU1MvrYrwhi5LU1tHre",
      expectedAccount: JSON.parse(
        JSON.stringify(accountFixture["TL24LCps5FKwp3PoU1MvrYrwhi5LU1tHre"]),
        reviver,
      ),
    },
  ])("should always be sync without error for address %s", async ({ id, expectedAccount }) => {
    const account = await syncAccount<Transaction, TronAccount>(bridge.accountBridge, {
      ...dummyAccount,
      id: `js:2:tron:${id}:`,
      freshAddress: id,
    });

    expect(account.id).toEqual(`js:2:tron:${id}:`);

    expect(account).toMatchObject(expectedAccount);
  });
});

describe("scanAccounts", () => {
  let spyGetTronAccountNetwork: jest.SpyInstance;
  const localMockServer = setupServer();

  const address = "TT2T17KZhoDu47i2E4FWxfG79zdkEWkU9N";

  beforeAll(() => {
    spyGetTronAccountNetwork = jest.spyOn(tronNetwork, "getTronAccountNetwork");

    // Mock the crypto assets store for scanAccounts tests - same as sync tests
    (getCryptoAssetsStore as jest.Mock).mockReturnValue({
      findTokenById: jest.fn().mockResolvedValue(null),
      findTokenByAddressInCurrency: jest.fn().mockResolvedValue(null),
    });

    coinConfig.setCoinConfig(() => ({
      status: {
        type: "active",
      },
      explorer: {
        url: TRONGRID_BASE_URL_MOCKED,
      },
    }));

    localMockServer.listen({ onUnhandledRequest: "error" });
  });

  beforeEach(() => {
    jest
      .spyOn(tronNetwork, "getLastBlock")
      .mockResolvedValueOnce({ height: 0, hash: "", time: new Date() });
    jest.spyOn(tronNetwork, "fetchTronAccount").mockResolvedValueOnce([
      {
        address,
      } as AccountTronAPI,
    ]);
    jest.spyOn(tronNetwork, "fetchTronAccountTxs").mockResolvedValueOnce([]);
    jest.spyOn(tronNetwork, "getUnwithdrawnReward").mockResolvedValueOnce(BigNumber(0));

    spyGetTronAccountNetwork.mockClear();
  });

  afterAll(() => {
    jest.restoreAllMocks();

    localMockServer.close();
  });

  it.each([
    {
      freeNetLimit: new BigNumber(0),
      expectedUsed: false,
    },
    {
      freeNetLimit: new BigNumber(100),
      expectedUsed: true,
    },
  ])("returns an account flagged as used", async ({ freeNetLimit, expectedUsed }) => {
    // Given
    spyGetTronAccountNetwork.mockResolvedValueOnce({
      family: "tron",
      freeNetUsed: BigNumber(0),
      freeNetLimit: BigNumber(freeNetLimit),
      netUsed: BigNumber(0),
      netLimit: BigNumber(0),
      energyUsed: BigNumber(0),
      energyLimit: BigNumber(0),
    });
    const addressResolver = {
      address: "TT2T17KZhoDu47i2E4FWxfG79zdkEWkU9N",
      path: "path",
      publicKey: "publicKey",
    };

    // When
    const scanAccounts = makeScanAccounts({
      getAccountShape,
      getAddressFn: (_deviceId, _addressOpt) => Promise.resolve(addressResolver),
    });
    const { account } = await firstValueFrom(
      scanAccounts({
        currency,
        deviceId: "",
        syncConfig: defaultSyncConfig,
      }),
    );

    // Then
    expect(spyGetTronAccountNetwork).toHaveBeenCalledTimes(1);
    expect(account.used).toEqual(expectedUsed);
  });
});

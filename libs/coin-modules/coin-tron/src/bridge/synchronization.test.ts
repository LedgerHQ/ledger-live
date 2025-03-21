import { makeScanAccounts } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
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
    jest.spyOn(tronNetwork, "getLastBlock").mockRestore();
    jest.spyOn(tronNetwork, "fetchTronAccountTxs").mockRestore();
    jest.spyOn(tronNetwork, "fetchTronAccountTxs").mockRestore();
    jest.spyOn(tronNetwork, "getUnwithdrawnReward").mockRestore();
    spyGetTronAccountNetwork.mockRestore();

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

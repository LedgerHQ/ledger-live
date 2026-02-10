import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { Account, AccountBridge, SyncConfig, TransactionCommon } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { firstValueFrom, reduce } from "rxjs";
import { TronCoinConfig } from "../config";
import { Transaction, TronAccount } from "../types";
import { defaultTronResources } from "./utils";
import { createBridges } from "./index";

const tron = getCryptoCurrencyById("tron");
const defaultSyncConfig = {
  paginationConfig: {},
  blacklistedTokenIds: [],
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
  currency: tron,
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

describe("Sync Accounts", () => {
  let bridge: ReturnType<typeof createBridges>;

  beforeAll(() => {
    const signer = jest.fn();
    const coinConfig = (): TronCoinConfig => ({
      status: {
        type: "active",
      },
      explorer: {
        url: "https://tron.coin.ledger.com",
      },
    });
    bridge = createBridges(signer, coinConfig);
  });

  it("should always have tronResources", async () => {
    const account = await syncAccount<Transaction, TronAccount>(
      bridge.accountBridge,
      dummyAccount,
      defaultSyncConfig,
    );

    expect(account.tronResources).toEqual(defaultTronResources);
  });

  it.skip("should always be sync without error", async () => {
    // GIVEN
    const id = "TL24LCps5FKwp3PoU1MvrYrwhi5LU1tHre";

    // WHEN
    const account = await syncAccount<Transaction, TronAccount>(bridge.accountBridge, {
      ...dummyAccount,
      id: `js:2:tron:${id}:`,
      freshAddress: id,
    });

    // THEN
    expect(account.id).toEqual(`js:2:tron:${id}:`);
    expect(account.freshAddress).toEqual("TL24LCps5FKwp3PoU1MvrYrwhi5LU1tHre");
    expect(account.operations[account.operations.length - 1]).toEqual({
      accountId: "js:2:tron:TL24LCps5FKwp3PoU1MvrYrwhi5LU1tHre:",
      blockHash: null,
      blockHeight: 24725965,
      date: new Date("2020-11-04T14:36:33.000Z"),
      extra: {},
      fee: new BigNumber("0"),
      hasFailed: false,
      hash: "22f871f18d39b6c39e3c1495ba529169bee3fbefd59b504dac15becaff264920",
      id: "js:2:tron:TL24LCps5FKwp3PoU1MvrYrwhi5LU1tHre:-22f871f18d39b6c39e3c1495ba529169bee3fbefd59b504dac15becaff264920-IN",
      recipients: ["TL24LCps5FKwp3PoU1MvrYrwhi5LU1tHre"],
      senders: ["TNDoSUL32A2KRqbEKXZQuPWgfBcA42sCwM"],
      type: "IN",
      value: new BigNumber("11234560"),
    });
    const separator = "%2F";
    expect(account.subAccounts![0].id).toEqual(
      `js:2:tron:TL24LCps5FKwp3PoU1MvrYrwhi5LU1tHre:+tron${separator}trc10${separator}1002000`,
    );
  });
});

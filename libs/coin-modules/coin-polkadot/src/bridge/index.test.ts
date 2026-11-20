import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { SignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type { Account, ScanAccountEvent } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { filter, firstValueFrom, lastValueFrom, map, reduce, toArray } from "rxjs";
import { createMockPolkadotContext } from "../test/config.fixture";
import type { PolkadotSigner } from "../types";
import type { PolkadotAccount } from "../types";
import { createFixtureAccount, createFixtureOperation } from "../types/bridge.fixture";
import { createBridges } from "./index";

const stubGetAccount = jest.fn();
const stubGetOperations = jest.fn();

jest.mock("../network", () => {
  return {
    getAccount: (_logger: unknown, _config: unknown, address: string, currencyId: string) =>
      stubGetAccount(address, currencyId),
    getOperations: (
      _logger: unknown,
      _config: unknown,
      accountId: string,
      address: string,
      _currency: unknown,
      startAt: number,
    ) => stubGetOperations(accountId, address, startAt),
  };
});

const SEED_ADDRESS = "12YA86tRQhHgwU3SSj56aesUKB7GKvdnZTTTXRop4vd3YgDV";
const SEED_PUBLIC_KEY = "cc".repeat(32);
const FIRST_ADDRESS = "13rdR5srvWFS3VkNeJuz5WkGkG6FSXQAxZB5QBGig4ATCs9s";
const SECOND_ADDRESS = "13drR5srvWFS3VkNeJuz5WkGkG6FSXQAxZB5QBGig4ATCs9s";
const SEED_PATH = "44'/354'/0'";
const FIRST_PATH = "44'/354'/0'/0'/0'";
const SECOND_PATH = "44'/354'/1'/0'/0'";

const addresses: Record<string, { address: string; pubKey: string }> = {
  [SEED_PATH]: { address: SEED_ADDRESS, pubKey: SEED_PUBLIC_KEY },
  [FIRST_PATH]: { address: FIRST_ADDRESS, pubKey: "aa".repeat(32) },
  [SECOND_PATH]: { address: SECOND_ADDRESS, pubKey: "bb".repeat(32) },
};

const requestedPaths: string[] = [];

const signerContext: SignerContext<PolkadotSigner> = (_deviceId, fn) =>
  fn({
    getAddress: async (path: string) => {
      requestedPaths.push(path);
      return { ...addresses[path], return_code: 0x9000 };
    },
    sign: async () => ({ signature: null, return_code: 0x9000 }),
  });

const emptyAccount = {
  blockHeight: 100,
  balance: new BigNumber(0),
  spendableBalance: new BigNumber(0),
  nonce: 0,
  lockedBalance: new BigNumber(0),
  unlockedBalance: new BigNumber(0),
  unlockingBalance: new BigNumber(0),
  controller: null,
  stash: null,
  unlockings: [],
  nominations: [],
  numSlashingSpans: 0,
};

const usedAccount = {
  ...emptyAccount,
  balance: new BigNumber(21_000_310),
  spendableBalance: new BigNumber(21_000_310),
  nonce: 4,
};

const operation = {
  id: "op-1",
  hash: "0x01",
  type: "IN",
  value: new BigNumber(21_000_310),
  fee: new BigNumber(0),
  senders: [SECOND_ADDRESS],
  recipients: [FIRST_ADDRESS],
  blockHeight: 90,
  blockHash: null,
  accountId: "",
  date: new Date("2024-01-01"),
  extra: {},
};

describe("polkadot currency bridge scanAccounts", () => {
  const currency = getCryptoCurrencyById("assethub_polkadot");
  const { currencyBridge } = createBridges(signerContext, createMockPolkadotContext());

  const scan = async (): Promise<Account[]> => {
    const events: ScanAccountEvent[] = await lastValueFrom(
      currencyBridge
        .scanAccounts({
          currency,
          deviceId: "",
          syncConfig: { paginationConfig: {}, blacklistedTokenIds: [] },
        })
        .pipe(toArray()),
    );
    return events.map(event => event.account);
  };

  beforeEach(() => {
    requestedPaths.length = 0;
    stubGetAccount.mockReset();
    stubGetOperations.mockReset();
    stubGetOperations.mockResolvedValue([]);
  });

  it("discovers the first account of an empty seed as unused", async () => {
    stubGetAccount.mockResolvedValue(emptyAccount);

    const [account] = await scan();

    expect({
      id: account.id,
      seedIdentifier: account.seedIdentifier,
      freshAddress: account.freshAddress,
      freshAddressPath: account.freshAddressPath,
      derivationMode: account.derivationMode,
      index: account.index,
      used: account.used,
      balance: account.balance.toString(),
      operationsCount: account.operationsCount,
    }).toEqual({
      id: `js:2:assethub_polkadot:${FIRST_ADDRESS}:polkadotbip44`,
      seedIdentifier: SEED_PUBLIC_KEY,
      freshAddress: FIRST_ADDRESS,
      freshAddressPath: FIRST_PATH,
      derivationMode: "polkadotbip44",
      index: 0,
      used: false,
      balance: "0",
      operationsCount: 0,
    });
  });

  it("stops scanning at the first unused account", async () => {
    stubGetAccount.mockResolvedValue(emptyAccount);

    await scan();

    expect(requestedPaths).toEqual([SEED_PATH, FIRST_PATH]);
  });

  it("keeps scanning after a used account and ends on an unused one", async () => {
    stubGetAccount.mockImplementation(async (address: string) =>
      address === FIRST_ADDRESS ? usedAccount : emptyAccount,
    );
    stubGetOperations.mockImplementation(async (_accountId: string, address: string) =>
      address === FIRST_ADDRESS ? [operation] : [],
    );

    const accounts = await scan();

    expect(requestedPaths).toEqual([SEED_PATH, FIRST_PATH, SECOND_PATH]);
    expect(accounts.map(account => [account.index, account.used])).toEqual([
      [0, true],
      [1, false],
    ]);
  });

  it("reads the balance and the polkadot resources of a used account", async () => {
    stubGetAccount.mockImplementation(async (address: string) =>
      address === FIRST_ADDRESS
        ? { ...usedAccount, controller: FIRST_ADDRESS, stash: FIRST_ADDRESS }
        : emptyAccount,
    );
    stubGetOperations.mockImplementation(async (_accountId: string, address: string) =>
      address === FIRST_ADDRESS ? [operation] : [],
    );

    const [account] = await scan();

    expect(account).toMatchObject({
      balance: new BigNumber(21_000_310),
      operationsCount: 1,
      polkadotResources: { controller: FIRST_ADDRESS, nonce: 4 },
    });
  });

  it("estimates the fees against the null address", () => {
    const { accountBridge } = createBridges(signerContext, createMockPolkadotContext());

    expect(accountBridge.getEstimationRecipient?.(createFixtureAccount())).toEqual(
      "111111111111111111111111111111111HC1",
    );
  });

  it("does not support signing a raw operation", () => {
    const { accountBridge } = createBridges(signerContext, createMockPolkadotContext());

    expect(() =>
      accountBridge.signRawOperation({
        account: createFixtureAccount(),
        transaction: "",
        deviceId: "device",
      }),
    ).toThrow("signRawOperation is not supported");
  });

  it("fetches the operations of the account from the beginning", async () => {
    stubGetAccount.mockResolvedValue(emptyAccount);

    await scan();

    expect(stubGetOperations).toHaveBeenCalledWith(
      `js:2:assethub_polkadot:${FIRST_ADDRESS}:polkadotbip44`,
      FIRST_ADDRESS,
      0,
    );
  });
});

describe("polkadot account bridge", () => {
  const { accountBridge } = createBridges(signerContext, createMockPolkadotContext());
  const account = createFixtureAccount();

  it("exposes the signing and the broadcast", () => {
    expect([typeof accountBridge.signOperation, typeof accountBridge.broadcast]).toEqual([
      "function",
      "function",
    ]);
  });

  it("creates an empty transaction with an empty recipient and a zero amount", () => {
    expect(accountBridge.createTransaction(account)).toMatchObject({
      amount: new BigNumber(0),
      recipient: "",
    });
  });

  it("creates the same empty transaction on every call", () => {
    expect(accountBridge.createTransaction(account)).toEqual(
      accountBridge.createTransaction(account),
    );
  });

  it("keeps the reference of a transaction updated with an empty patch", () => {
    const transaction = accountBridge.createTransaction(account);

    const updated = accountBridge.updateTransaction(transaction, {});

    expect(accountBridge.updateTransaction(updated, {})).toBe(updated);
  });

  it("keeps the reference of a transaction updated twice with the same patch", () => {
    const patch = { amount: new BigNumber(1000), recipient: account.freshAddress };
    const transaction = accountBridge.createTransaction(account);

    const updated = accountBridge.updateTransaction(transaction, patch);

    expect(accountBridge.updateTransaction(updated, patch)).toBe(updated);
  });
});

describe("polkadot account bridge sync", () => {
  const { currencyBridge, accountBridge } = createBridges(
    signerContext,
    createMockPolkadotContext(),
  );
  const syncConfig = { paginationConfig: {}, blacklistedTokenIds: [] };
  const chain = [4, 3, 2, 1].map(n =>
    createFixtureOperation({
      id: `op-${n}`,
      hash: `0x0${n}`,
      type: "IN",
      blockHeight: 100 * n,
      date: new Date(2024, 0, n),
    }),
  );

  const isPolkadotAccount = (account: Account): account is PolkadotAccount =>
    account.currency.family === "polkadot";

  const scanFirst = (): Promise<PolkadotAccount> =>
    firstValueFrom(
      currencyBridge
        .scanAccounts({
          currency: getCryptoCurrencyById("assethub_polkadot"),
          deviceId: "",
          syncConfig,
        })
        .pipe(
          map(event => event.account),
          filter(isPolkadotAccount),
        ),
    );

  const sync = (account: PolkadotAccount): Promise<PolkadotAccount> =>
    firstValueFrom(
      accountBridge
        .sync(account, syncConfig)
        .pipe(reduce((current, update) => update(current), account)),
    );

  beforeEach(() => {
    stubGetAccount.mockReset();
    stubGetOperations.mockReset();
    stubGetAccount.mockResolvedValue(usedAccount);
    stubGetOperations.mockImplementation(
      async (_accountId: string, _address: string, startAt: number) =>
        chain.filter(op => (op.blockHeight ?? 0) >= startAt).map(op => ({ ...op })),
    );
  });

  it("fetches only the operations after the newest one it already has", async () => {
    const account = await scanFirst();
    stubGetOperations.mockClear();

    await sync({ ...account, operations: chain.slice(2), operationsCount: 2 });

    expect(stubGetOperations).toHaveBeenCalledWith(account.id, account.freshAddress, 201);
  });

  it("completes the operations it already has with the newer ones", async () => {
    const account = await scanFirst();

    const synced = await sync({ ...account, operations: chain.slice(2), operationsCount: 2 });

    expect(synced.operations.map(operation => operation.id)).toEqual([
      "op-4",
      "op-3",
      "op-2",
      "op-1",
    ]);
  });

  it("keeps the references of the operations it already has", async () => {
    const account = await scanFirst();
    const existing = chain.slice(2);

    const synced = await sync({ ...account, operations: existing, operationsCount: 2 });

    expect(
      synced.operations.slice(2).every((operation, index) => operation === existing[index]),
    ).toBe(true);
  });

  it("has no operation with a duplicated id", async () => {
    stubGetOperations.mockResolvedValue([...chain, ...chain].map(op => ({ ...op })));
    const account = await scanFirst();

    const synced = await sync(account);

    expect(synced.operations.map(operation => operation.id)).toEqual([
      "op-4",
      "op-3",
      "op-2",
      "op-1",
    ]);
  });

  it("cleans up a pending operation once it is confirmed", async () => {
    const account = await scanFirst();

    const synced = await sync({
      ...account,
      operations: chain.slice(1),
      operationsCount: 3,
      pendingOperations: [{ ...chain[0], date: new Date() }],
    });

    expect({
      operations: synced.operations.map(operation => operation.id),
      pendingOperations: synced.pendingOperations,
    }).toEqual({ operations: ["op-4", "op-3", "op-2", "op-1"], pendingOperations: [] });
  });
});

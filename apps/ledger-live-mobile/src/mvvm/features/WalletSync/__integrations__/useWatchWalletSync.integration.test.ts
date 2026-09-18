import { EMPTY } from "rxjs";
import { getEnv, setEnv } from "@shared/env";
import { makeCipher } from "@shared/cloud-sync";
import { getSdk } from "@ledgerhq/ledger-key-ring-protocol";
import type { MemberCredentials, Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
import { accountsSyncModule } from "@ledgerhq/live-wallet/accounts";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Account } from "@ledgerhq/types-live";
import { HttpResponse, http, server } from "@tests/server";
import { renderHook, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { useWatchWalletSync } from "../hooks/useWatchWalletSync";

const originalMockEnv = getEnv("MOCK");
const cloudSyncApiBaseUrl = getEnv("CLOUD_SYNC_API_PROD");

const trustchain: Trustchain = {
  rootId: "mock-root-id-cursor-regression",
  applicationPath: "m/0'/16'/0'",
  walletSyncEncryptionKey: "1".padStart(64, "0"),
};

const memberCredentials: MemberCredentials = {
  pubkey: "mock-pub-key-cursor-regression",
  privatekey: "mock-private-key-cursor-regression",
};

const accountA = genAccount("cursor-regression-account-a");
const accountB = genAccount("cursor-regression-account-b");

type EndpointResult = Response;
type EndpointParams = [{ request: Request }];

const endpoints = {
  pull: jest.fn<EndpointResult, EndpointParams>(),
  push: jest.fn<EndpointResult, EndpointParams>(),
};

describe("useWatchWalletSync PROD cursor synchronization", () => {
  beforeAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    setEnv("MOCK", "cursor-regression");
    endpoints.pull.mockReset();
    endpoints.push.mockReset();
    server.use(
      http.get(`${cloudSyncApiBaseUrl}/atomic/v1/live`, endpoints.pull),
      http.post(`${cloudSyncApiBaseUrl}/atomic/v1/live`, endpoints.push),
    );
  });

  afterEach(() => {
    setEnv("MOCK", originalMockEnv);
  });

  afterAll(() => {
    jest.useFakeTimers();
  });

  it("should apply PROD data when its cursor is newer than the local cursor", async () => {
    /**
     * GIVEN
     * - Local wallet: accounts [A, B].
     * - Cached distant state: version 7, accounts [A, B].
     * - PROD backend: version 10, accounts [A].
     *
     * WHEN the Wallet Sync loop runs.
     *
     * THEN PROD is pulled and account B is removed locally.
     */
    endpoints.pull.mockReturnValue(
      HttpResponse.json({
        status: "out-of-sync",
        version: 10,
        payload: await encrypt(trustchain, {
          accounts: descriptorsFor([accountA]),
        }),
        date: "2026-09-17T00:00:00.000Z",
      }),
    );
    endpoints.push.mockReturnValue(HttpResponse.json({ status: "updated" }));

    const { result, store } = renderWalletSync({
      localAccounts: [accountA, accountB],
      cachedDistantAccounts: [accountA, accountB],
      cursorVersion: 7,
    });

    await waitFor(() => {
      expect(store.getState().wallet.walletSync.walletSyncState.version).toBe(10);
    });
    expect(endpoints.pull).toHaveBeenCalledTimes(1);
    expectPullVersion("7");
    expect(endpoints.push).not.toHaveBeenCalled();
    expect(result.current.walletSyncError).toBeNull();
    expect(store.getState().accounts.active.map(account => account.id)).toEqual([accountA.id]);
    expect(store.getState().wallet.walletSync.walletSyncState.data).toEqual({
      accounts: descriptorsFor([accountA]),
    });
  });

  it("should keep local data when the PROD cursor is older than the local cursor", async () => {
    /**
     * GIVEN
     * - Local wallet: accounts [A, B].
     * - Cached distant state: version 10, accounts [A, B].
     * - PROD backend: version 7, accounts [A].
     *
     * WHEN the Wallet Sync loop runs.
     *
     * THEN PROD reports that the cursor is up to date and local data remains unchanged.
     */
    endpoints.pull.mockReturnValue(HttpResponse.json({ status: "up-to-date" }));
    endpoints.push.mockReturnValue(HttpResponse.json({ status: "updated" }));

    const { result, store } = renderWalletSync({
      localAccounts: [accountA, accountB],
      cachedDistantAccounts: [accountA, accountB],
      cursorVersion: 10,
    });

    await waitFor(() => {
      expect(endpoints.pull).toHaveBeenCalledTimes(1);
    });

    expect(endpoints.push).not.toHaveBeenCalled();
    expectPullVersion("10");
    expect(result.current.walletSyncError).toBeNull();
    expect(store.getState().accounts.active.map(account => account.id)).toEqual([
      accountA.id,
      accountB.id,
    ]);
    expect(store.getState().wallet.walletSync.walletSyncState).toEqual({
      data: { accounts: descriptorsFor([accountA, accountB]) },
      version: 10,
      environment: "PROD",
    });
  });

  it("should overwrite PROD from local data when both cursors have the same version", async () => {
    /**
     * GIVEN
     * - Local wallet: accounts [A].
     * - Cached distant state: version 7, accounts [A, B].
     * - PROD backend: version 7, accounts [A, C].
     *
     * WHEN the Wallet Sync loop runs.
     *
     * THEN PROD reports that the cursor is up to date and is overwritten with accounts [A].
     */
    endpoints.pull.mockReturnValue(HttpResponse.json({ status: "up-to-date" }));
    endpoints.push.mockReturnValue(HttpResponse.json({ status: "updated" }));

    const { result, store } = renderWalletSync({
      localAccounts: [accountA],
      cachedDistantAccounts: [accountA, accountB],
      cursorVersion: 7,
    });

    await waitFor(() => {
      expect(endpoints.push).toHaveBeenCalledTimes(1);
      expect(store.getState().wallet.walletSync.walletSyncState.version).toBe(8);
    });

    expect(endpoints.pull).toHaveBeenCalledTimes(1);
    expectPullVersion("7");
    expect(result.current.walletSyncError).toBeNull();
    expect(new URL(endpoints.push.mock.calls[0][0].request.url).searchParams.get("version")).toBe(
      "8",
    );
    const { payload } = (await endpoints.push.mock.calls[0][0].request.json()) as {
      payload: string;
    };
    expect(await decrypt(trustchain, payload)).toMatchObject({
      accounts: descriptorsFor([accountA]),
    });
  });

  it("should reset the local cursor when PROD has no data", async () => {
    /**
     * GIVEN
     * - Local wallet: accounts [A, B].
     * - Cached distant state: version 7, accounts [A, B].
     * - PROD backend: no data.
     *
     * WHEN the Wallet Sync loop runs.
     *
     * THEN the cached distant state is cleared and local accounts remain unchanged.
     */
    endpoints.pull.mockReturnValue(HttpResponse.json({ status: "no-data" }));
    endpoints.push.mockReturnValue(HttpResponse.json({ status: "updated" }));

    const { result, store } = renderWalletSync({
      localAccounts: [accountA, accountB],
      cachedDistantAccounts: [accountA, accountB],
      cursorVersion: 7,
    });

    await waitFor(() => {
      expect(store.getState().wallet.walletSync.walletSyncState).toEqual({
        data: null,
        version: 0,
        environment: "PROD",
      });
    });

    expect(endpoints.pull).toHaveBeenCalledTimes(1);
    expectPullVersion("7");
    expect(endpoints.push).not.toHaveBeenCalled();
    expect(result.current.walletSyncError).toBeNull();
    expect(store.getState().accounts.active.map(account => account.id)).toEqual([
      accountA.id,
      accountB.id,
    ]);
  });

  it("should push local data when PROD and the local cursor have no data", async () => {
    /**
     * GIVEN
     * - Local wallet: accounts [A, B].
     * - Cached distant state: version 0, no data.
     * - PROD backend: no data.
     *
     * WHEN the Wallet Sync loop runs.
     *
     * THEN local accounts are pushed to PROD as version 1.
     */
    endpoints.pull.mockReturnValue(HttpResponse.json({ status: "no-data" }));
    endpoints.push.mockReturnValue(HttpResponse.json({ status: "updated" }));

    const { result, store } = renderWalletSync({
      localAccounts: [accountA, accountB],
      cachedDistantAccounts: null,
      cursorVersion: 0,
    });

    await waitFor(() => {
      expect(endpoints.push).toHaveBeenCalledTimes(1);
      expect(store.getState().wallet.walletSync.walletSyncState.version).toBe(1);
    });

    expect(endpoints.pull).toHaveBeenCalledTimes(1);
    expectPullVersion("0");
    expect(result.current.walletSyncError).toBeNull();
    expect(new URL(endpoints.push.mock.calls[0][0].request.url).searchParams.get("version")).toBe(
      "1",
    );
    const { payload } = (await endpoints.push.mock.calls[0][0].request.json()) as {
      payload: string;
    };
    expect(await decrypt(trustchain, payload)).toMatchObject({
      accounts: descriptorsFor([accountA, accountB]),
    });
  });

  it("should reset a cursor from another environment before the first PROD pull", async () => {
    /**
     * GIVEN
     * - Local wallet: accounts [A, B].
     * - Cached distant state: STAGING version 7, accounts [A, B].
     * - PROD backend: no data.
     *
     * WHEN the Wallet Sync loop runs.
     *
     * THEN the stale cursor is reset and the first PROD pull uses version 0.
     */
    endpoints.pull.mockReturnValue(HttpResponse.json({ status: "no-data" }));
    endpoints.push.mockReturnValue(HttpResponse.json({ status: "updated" }));

    const { result, store } = renderWalletSync({
      localAccounts: [accountA, accountB],
      cachedDistantAccounts: [accountA, accountB],
      cursorVersion: 7,
      cursorEnvironment: "STAGING",
    });

    await waitFor(() => {
      expect(endpoints.push).toHaveBeenCalledTimes(1);
      expect(store.getState().wallet.walletSync.walletSyncState.version).toBe(1);
    });

    expect(endpoints.pull).toHaveBeenCalledTimes(1);
    expectPullVersion("0");
    expect(result.current.walletSyncError).toBeNull();
    expect(store.getState().wallet.walletSync.walletSyncState.environment).toBe("PROD");
    expect(store.getState().accounts.active.map(account => account.id)).toEqual([
      accountA.id,
      accountB.id,
    ]);
  });
});

function renderWalletSync({
  localAccounts,
  cachedDistantAccounts,
  cursorVersion,
  cursorEnvironment = "PROD",
}: {
  localAccounts: Account[];
  cachedDistantAccounts: Account[] | null;
  cursorVersion: number;
  cursorEnvironment?: "PROD" | "STAGING";
}) {
  return renderHook(() => useWatchWalletSync(), {
    overrideInitialState: withFlagOverrides(
      {
        llmWalletSync: {
          enabled: true,
          params: {
            environment: "PROD",
            watchConfig: {
              notificationsEnabled: false,
              initialTimeout: 1,
              pollingInterval: 60_000,
            },
          },
        },
      },
      state => ({
        ...state,
        accounts: {
          ...state.accounts,
          active: localAccounts,
        },
        trustchain: {
          environment: "PROD",
          PROD: { trustchain, memberCredentials },
          STAGING: null,
        },
        wallet: {
          ...state.wallet,
          walletSync: {
            ...state.wallet.walletSync,
            walletSyncState: {
              data:
                cachedDistantAccounts === null
                  ? null
                  : { accounts: descriptorsFor(cachedDistantAccounts) },
              version: cursorVersion,
              environment: cursorEnvironment,
            },
            isHydrated: true,
          },
        },
        settings: {
          ...state.settings,
          readOnlyModeEnabled: false,
        },
      }),
    ),
  });
}

function expectPullVersion(version: string) {
  expect(new URL(endpoints.pull.mock.calls[0][0].request.url).searchParams.get("version")).toBe(
    version,
  );
}

function descriptorsFor(accounts: Account[]) {
  return accountsSyncModule.diffLocalToDistant(
    { list: accounts, nonImportedAccountInfos: [] },
    null,
  ).nextState;
}

function encrypt(targetTrustchain: Trustchain, payload: unknown): Promise<string> {
  return makeCipher(
    getSdk(
      true,
      { applicationId: 16, name: "Cursor regression", apiBaseUrl: "foo" },
      () => () => EMPTY,
    ),
  ).encrypt(targetTrustchain, payload);
}

function decrypt(targetTrustchain: Trustchain, payload: string): Promise<unknown> {
  return makeCipher(
    getSdk(
      true,
      { applicationId: 16, name: "Cursor regression", apiBaseUrl: "foo" },
      () => () => EMPTY,
    ),
  ).decrypt(targetTrustchain, payload);
}

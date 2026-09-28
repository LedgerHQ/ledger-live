import { createFetchMock, RFC6238_SECRET } from "../__mocks__/fetchMock";
import type { MockResponseSpec } from "../__mocks__/fetchMock";
import { ENV_VARS } from "../config";
import type { EnvSource } from "../config";
import type { FetchImpl } from "../types";
import { clearBaanxAuthCache, getBaanxAuthToken } from "./session";

const ENV: EnvSource = {
  [ENV_VARS.clientKey]: "env-client-key",
  [ENV_VARS.email]: "tester@ledger.test",
  [ENV_VARS.password]: "env-password",
  [ENV_VARS.totpSecret]: RFC6238_SECRET,
};

function holdFetch(specs: MockResponseSpec[]) {
  let release = () => {};
  const gate = new Promise<void>(resolve => {
    release = resolve;
  });
  const mock = createFetchMock(specs);
  const fetchImpl = (async (input: string, init?: RequestInit) => {
    await gate;
    return mock.fetchImpl(input, init);
  }) as FetchImpl;

  return { fetchImpl, requests: mock.requests, release };
}

beforeEach(() => {
  clearBaanxAuthCache();
});

describe("getBaanxAuthToken", () => {
  it("logs in and returns the session", async () => {
    const { fetchImpl, requests } = createFetchMock([
      { body: { accessToken: "token-1", userId: "user-1" } },
    ]);

    const session = await getBaanxAuthToken({ env: ENV, deps: { fetchImpl } });

    expect(session.accessToken).toBe("token-1");
    expect(requests).toHaveLength(1);
  });

  it("reuses the cached token instead of logging in again", async () => {
    const { fetchImpl, requests } = createFetchMock([{ body: { accessToken: "token-1" } }]);

    const first = await getBaanxAuthToken({ env: ENV, deps: { fetchImpl } });
    const second = await getBaanxAuthToken({ env: ENV, deps: { fetchImpl } });

    expect(second).toBe(first);
    expect(requests).toHaveLength(1);
  });

  it("does not recache a login that finishes after the cache was cleared", async () => {
    const first = holdFetch([{ body: { accessToken: "token-1" } }]);
    const pending = getBaanxAuthToken({ env: ENV, deps: { fetchImpl: first.fetchImpl } });

    clearBaanxAuthCache();
    first.release();
    await pending;

    const second = createFetchMock([{ body: { accessToken: "token-2" } }]);
    const session = await getBaanxAuthToken({ env: ENV, deps: { fetchImpl: second.fetchImpl } });

    expect(session.accessToken).toBe("token-2");
    expect(second.requests).toHaveLength(1);
  });

  it("does not let a cleared login overwrite a newer in-flight entry", async () => {
    const first = holdFetch([{ body: { accessToken: "token-1" } }]);
    const pendingFirst = getBaanxAuthToken({ env: ENV, deps: { fetchImpl: first.fetchImpl } });

    clearBaanxAuthCache();

    const second = holdFetch([{ body: { accessToken: "token-2" } }]);
    const pendingSecond = getBaanxAuthToken({ env: ENV, deps: { fetchImpl: second.fetchImpl } });

    first.release();
    await pendingFirst;

    const unused = createFetchMock([]);
    const pendingJoin = getBaanxAuthToken({ env: ENV, deps: { fetchImpl: unused.fetchImpl } });

    second.release();
    const [later, joined] = await Promise.all([pendingSecond, pendingJoin]);

    expect(later.accessToken).toBe("token-2");
    expect(joined.accessToken).toBe("token-2");
    expect(unused.requests).toHaveLength(0);
  });
});

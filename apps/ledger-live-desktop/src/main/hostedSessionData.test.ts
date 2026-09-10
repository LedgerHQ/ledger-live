import type { Cookie, Session } from "electron";
import { clearHostedSessionData, isProviderCookieForHost } from "./hostedSessionData";

describe("isProviderCookieForHost", () => {
  it.each([
    ["dev.api.baanx.com", "dev.api.baanx.com"],
    ["login.dev.api.baanx.com", "dev.api.baanx.com"],
    [".baanx.com", "dev.api.baanx.com"],
    ["baanx.com", "dev.api.baanx.com"],
    ["hosted.baanxapi.com", "hosted.baanxapi.com"],
    ["card.api.live.ledger.com", "card.api.live.ledger.com"],
  ])("removes the cookie on %s for the host %s", (cookieDomain, host) => {
    expect(isProviderCookieForHost(cookieDomain, host)).toBe(true);
  });

  it.each([
    [".ledger.com", "card.api.live.ledger.com"],
    [".live.ledger.com", "card.api.live.ledger.com"],
    ["ledger.com", "card.api.live.ledger.com"],
    ["other.baanx.com", "dev.api.baanx.com"],
    ["baanxapi.com", "dev.api.baanx.com"],
    ["", "dev.api.baanx.com"],
    ["ledger.com", "ledger.com"],
    ["www.ledger.com", "ledger.com"],
    [".ledger.com", "ledger.com"],
  ])("keeps the cookie on %s for the host %s", (cookieDomain, host) => {
    expect(isProviderCookieForHost(cookieDomain, host)).toBe(false);
  });
});

function fakeSession(cookies: Partial<Cookie>[]) {
  const remove = jest.fn().mockResolvedValue(undefined);
  const clearStorageData = jest.fn().mockResolvedValue(undefined);
  const get = jest.fn().mockResolvedValue(cookies);

  return {
    session: { cookies: { get, remove }, clearStorageData } as unknown as Session,
    get,
    remove,
    clearStorageData,
  };
}

describe("clearHostedSessionData", () => {
  it("removes every provider cookie, and leaves the shared Ledger one", async () => {
    const { session, get, remove } = fakeSession([
      { domain: ".baanx.com", name: "sso", path: "/", secure: true },
      { domain: "dev.api.baanx.com", name: "csrf", path: "/auth", secure: true },
      { domain: ".ledger.com", name: "ledger_session", path: "/", secure: true },
    ]);

    await clearHostedSessionData(session, ["https://dev.api.baanx.com"]);

    expect(get).toHaveBeenCalledWith({ domain: "dev.api.baanx.com" });
    expect(remove).toHaveBeenCalledWith("https://baanx.com/", "sso");
    expect(remove).toHaveBeenCalledWith("https://dev.api.baanx.com/auth", "csrf");
    expect(remove).toHaveBeenCalledTimes(2);
  });

  it("clears the origin storages that can hold a session as well", async () => {
    const { session, clearStorageData } = fakeSession([]);

    await clearHostedSessionData(session, ["https://dev.api.baanx.com"]);

    expect(clearStorageData).toHaveBeenCalledWith({
      origin: "https://dev.api.baanx.com",
      storages: ["localstorage", "indexdb", "serviceworkers", "cachestorage"],
    });
  });

  it("looks the cookies up on the hostname, and clears the storages on the whole origin", async () => {
    const { session, get, clearStorageData } = fakeSession([]);

    await clearHostedSessionData(session, ["https://provider.test:8443"]);

    expect(get).toHaveBeenCalledWith({ domain: "provider.test" });
    expect(clearStorageData).toHaveBeenCalledWith({
      origin: "https://provider.test:8443",
      storages: ["localstorage", "indexdb", "serviceworkers", "cachestorage"],
    });
  });

  it("clears the storages even when a cookie refuses to go", async () => {
    const { session, remove, clearStorageData } = fakeSession([
      { domain: ".baanx.com", name: "sso", path: "/", secure: true },
      { domain: "dev.api.baanx.com", name: "csrf", path: "/auth", secure: true },
    ]);
    remove.mockRejectedValueOnce(new Error("the cookie store is locked"));

    await clearHostedSessionData(session, ["https://dev.api.baanx.com"]);

    expect(remove).toHaveBeenCalledTimes(2);
    expect(clearStorageData).toHaveBeenCalledWith({
      origin: "https://dev.api.baanx.com",
      storages: ["localstorage", "indexdb", "serviceworkers", "cachestorage"],
    });
  });

  it("clears the storages, and moves on to the next origin, when a cookie read fails", async () => {
    const { session, get, clearStorageData } = fakeSession([]);
    get.mockRejectedValueOnce(new Error("the cookie store is locked"));

    await clearHostedSessionData(session, ["https://dev.api.baanx.com", "https://provider.test"]);

    expect(clearStorageData).toHaveBeenCalledWith({
      origin: "https://dev.api.baanx.com",
      storages: ["localstorage", "indexdb", "serviceworkers", "cachestorage"],
    });
    expect(clearStorageData).toHaveBeenCalledWith({
      origin: "https://provider.test",
      storages: ["localstorage", "indexdb", "serviceworkers", "cachestorage"],
    });
    expect(get).toHaveBeenCalledWith({ domain: "provider.test" });
  });

  it("moves on to the next origin when a storage clear fails", async () => {
    const { session, clearStorageData, get } = fakeSession([]);
    clearStorageData.mockRejectedValueOnce(new Error("the storage partition is locked"));

    await clearHostedSessionData(session, ["https://dev.api.baanx.com", "https://provider.test"]);

    expect(clearStorageData).toHaveBeenCalledWith({
      origin: "https://provider.test",
      storages: ["localstorage", "indexdb", "serviceworkers", "cachestorage"],
    });
    expect(get).toHaveBeenCalledWith({ domain: "provider.test" });
  });

  it.each([
    [undefined],
    ["https://dev.api.baanx.com"],
    [[""]],
    [[42]],
    [["dev.api.baanx.com"]],
    [["file:///etc/passwd"]],
    [["chrome-extension://dev.api.baanx.com"]],
  ])("does nothing for the origin list %p", async origins => {
    const { session, get, clearStorageData } = fakeSession([]);

    await clearHostedSessionData(session, origins);

    expect(get).not.toHaveBeenCalled();
    expect(clearStorageData).not.toHaveBeenCalled();
  });
});

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

    await clearHostedSessionData(session, ["dev.api.baanx.com"]);

    expect(get).toHaveBeenCalledWith({ domain: "dev.api.baanx.com" });
    expect(remove).toHaveBeenCalledWith("https://baanx.com/", "sso");
    expect(remove).toHaveBeenCalledWith("https://dev.api.baanx.com/auth", "csrf");
    expect(remove).toHaveBeenCalledTimes(2);
  });

  it("clears the origin storages that can hold a session as well", async () => {
    const { session, clearStorageData } = fakeSession([]);

    await clearHostedSessionData(session, ["dev.api.baanx.com"]);

    expect(clearStorageData).toHaveBeenCalledWith({
      origin: "https://dev.api.baanx.com",
      storages: ["localstorage", "indexdb", "serviceworkers", "cachestorage"],
    });
  });

  it.each([[undefined], ["dev.api.baanx.com"], [[""]], [[42]]])(
    "does nothing for the host list %p",
    async hosts => {
      const { session, get, clearStorageData } = fakeSession([]);

      await clearHostedSessionData(session, hosts);

      expect(get).not.toHaveBeenCalled();
      expect(clearStorageData).not.toHaveBeenCalled();
    },
  );
});

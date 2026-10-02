import type { Session } from "electron";
import {
  EXPLORER_URL_PATTERNS,
  parseAffinityCookie,
  setupExplorerSessionAffinity,
} from "./explorerSessionAffinity";

type ResponseListener = (details: {
  url: string;
  responseHeaders?: Record<string, string[]>;
}) => void;
type BeforeSendHeadersListener = (
  details: { url: string; requestHeaders: Record<string, string> },
  callback: (response: { requestHeaders: Record<string, string> }) => void,
) => void;

const NOW = Date.parse("2026-09-29T12:00:00Z");
const PROD_URL = "https://explorers.api.live.ledger.com/blockchain/v4/btc/block/current";
const A4_URL = "https://explorers.api.live.ledger.com/a4/networks";
const STAGING_URL =
  "https://explorers.api.live.stg.ledger-test.com/blockchain/v4/btc/block/current";
const setCookie = (value: string, expires = "Wed, 30 Sep 2026 12:00:00 GMT") =>
  `__cflb=${value}; HttpOnly; SameSite=Lax; Path=/; Expires=${expires}`;

const setup = (now = () => NOW) => {
  const onResponseStarted = jest.fn();
  const onBeforeSendHeaders = jest.fn();
  const session = { webRequest: { onResponseStarted, onBeforeSendHeaders } } as unknown as Session;
  setupExplorerSessionAffinity(session, now);

  const respond: ResponseListener = details => onResponseStarted.mock.calls[0][1](details);
  const send = (url: string, requestHeaders: Record<string, string> = {}) => {
    const listener: BeforeSendHeadersListener = onBeforeSendHeaders.mock.calls[0][1];
    let sent: Record<string, string> | undefined;
    listener({ url, requestHeaders }, response => (sent = response.requestHeaders));
    return sent;
  };
  return { onResponseStarted, onBeforeSendHeaders, respond, send };
};

describe("parseAffinityCookie", () => {
  it("reads the value and Expires of a __cflb cookie", () => {
    expect(parseAffinityCookie(setCookie("abc"), NOW)).toEqual({
      value: "abc",
      expiresAt: Date.parse("Wed, 30 Sep 2026 12:00:00 GMT"),
    });
  });

  it("gives Max-Age precedence over Expires", () => {
    expect(parseAffinityCookie(`${setCookie("abc")}; Max-Age=60`, NOW)?.expiresAt).toBe(
      NOW + 60_000,
    );
  });

  it("treats a cookie without expiry as valid for the app session", () => {
    expect(parseAffinityCookie("__cflb=abc; Path=/", NOW)?.expiresAt).toBe(Infinity);
  });

  it("ignores other cookies", () => {
    expect(parseAffinityCookie("__cf_bm=abc; Path=/", NOW)).toBeUndefined();
    expect(parseAffinityCookie("__cflbx=abc; Path=/", NOW)).toBeUndefined();
  });
});

describe("setupExplorerSessionAffinity", () => {
  it("only listens to explorer hosts", () => {
    const { onResponseStarted, onBeforeSendHeaders } = setup();

    expect(onResponseStarted).toHaveBeenCalledWith(
      { urls: EXPLORER_URL_PATTERNS },
      expect.any(Function),
    );
    expect(onBeforeSendHeaders).toHaveBeenCalledWith(
      { urls: EXPLORER_URL_PATTERNS },
      expect.any(Function),
    );
  });

  it("leaves requests untouched until the explorer sets the cookie", () => {
    const { send } = setup();

    expect(send(PROD_URL, { Accept: "application/json" })).toEqual({ Accept: "application/json" });
  });

  it("replays the cookie set by the explorer on the next requests", () => {
    const { respond, send } = setup();

    respond({ url: PROD_URL, responseHeaders: { "set-cookie": [setCookie("abc")] } });

    expect(send(PROD_URL)).toEqual({ Cookie: "__cflb=abc" });
    expect(send(PROD_URL)).toEqual({ Cookie: "__cflb=abc" });
  });

  it("finds Set-Cookie regardless of header casing and among other cookies", () => {
    const { respond, send } = setup();

    respond({
      url: PROD_URL,
      responseHeaders: { "Set-Cookie": ["__cf_bm=bot; Path=/", setCookie("abc")] },
    });

    expect(send(PROD_URL)).toEqual({ Cookie: "__cflb=abc" });
  });

  it("appends to an existing Cookie header without duplicating the affinity cookie", () => {
    const { respond, send } = setup();
    respond({ url: PROD_URL, responseHeaders: { "set-cookie": [setCookie("abc")] } });

    expect(send(PROD_URL, { cookie: "other=1" })).toEqual({ cookie: "other=1; __cflb=abc" });
    expect(send(PROD_URL, { Cookie: "__cflb=kept" })).toEqual({ Cookie: "__cflb=kept" });
  });

  it("keeps separate cookies for the load-balancer pools of one host", () => {
    const { respond, send } = setup();
    respond({ url: A4_URL, responseHeaders: { "set-cookie": [setCookie("a4")] } });
    respond({ url: PROD_URL, responseHeaders: { "set-cookie": [setCookie("blockchain")] } });

    expect(send(A4_URL)).toEqual({ Cookie: "__cflb=a4" });
    expect(send(PROD_URL)).toEqual({ Cookie: "__cflb=blockchain" });
    expect(send("https://explorers.api.live.ledger.com/blockchain/v4/eth/block/current")).toEqual({
      Cookie: "__cflb=blockchain",
    });
  });

  it("keeps one cookie per explorer host", () => {
    const { respond, send } = setup();
    respond({ url: PROD_URL, responseHeaders: { "set-cookie": [setCookie("prod")] } });
    respond({ url: STAGING_URL, responseHeaders: { "set-cookie": [setCookie("staging")] } });

    expect(send(PROD_URL)).toEqual({ Cookie: "__cflb=prod" });
    expect(send(STAGING_URL)).toEqual({ Cookie: "__cflb=staging" });
  });

  it("switches to a new origin when the explorer reassigns the cookie", () => {
    const { respond, send } = setup();
    respond({ url: PROD_URL, responseHeaders: { "set-cookie": [setCookie("old")] } });
    respond({ url: PROD_URL, responseHeaders: { "set-cookie": [setCookie("new")] } });

    expect(send(PROD_URL)).toEqual({ Cookie: "__cflb=new" });
  });

  it("forgets the cookie once it expires", () => {
    let now = NOW;
    const { respond, send } = setup(() => now);
    respond({
      url: PROD_URL,
      responseHeaders: { "set-cookie": [`${setCookie("abc")}; Max-Age=60`] },
    });

    now += 61_000;

    expect(send(PROD_URL)).toEqual({});
  });

  it("forgets the cookie when the explorer clears it", () => {
    const { respond, send } = setup();
    respond({ url: PROD_URL, responseHeaders: { "set-cookie": [setCookie("abc")] } });
    respond({
      url: PROD_URL,
      responseHeaders: { "set-cookie": ["__cflb=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT"] },
    });

    expect(send(PROD_URL)).toEqual({});
  });
});

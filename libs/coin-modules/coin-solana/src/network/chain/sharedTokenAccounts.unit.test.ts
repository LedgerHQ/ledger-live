import { PublicKey } from "@solana/web3.js";
import { parseTokenAccountInfo } from "./account/parser";
import {
  clearSharedTokenAccounts,
  SHARED_TOKEN_ACCOUNTS_MAX,
  SHARED_TOKEN_ACCOUNTS_TTL_MS,
  sharedTokenAccounts,
} from "./sharedTokenAccounts";

const ENDPOINT = "https://solana.example.com";
const SPL = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const TOKEN_2022 = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
const OWNER = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";

describe("sharedTokenAccounts", () => {
  // lru-cache keeps the `performance` object it finds at load time, so faking timers alone does
  // not move its clock: drive `performance.now` by hand and advance timers alongside it.
  let clock = 0;
  const advance = (ms: number) => {
    clock += ms;
    jest.advanceTimersByTime(ms);
  };

  beforeEach(() => {
    // Not 0: lru-cache reads a start time of 0 as "no TTL".
    clock = 1_000_000;
    jest.useFakeTimers({ doNotFake: ["performance"] });
    jest.spyOn(performance, "now").mockImplementation(() => clock);
    clearSharedTokenAccounts();
  });

  afterEach(() => {
    // lru-cache clears its cached "now" on a timer: run it, or the next test reads a frozen clock.
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("shares one lookup between concurrent callers", async () => {
    const fetch = jest.fn().mockResolvedValue("accounts");

    const results = await Promise.all([
      sharedTokenAccounts(ENDPOINT, SPL, OWNER, fetch),
      sharedTokenAccounts(ENDPOINT, SPL, OWNER, fetch),
    ]);

    expect(results).toEqual(["accounts", "accounts"]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("reuses a lookup within the window, then reads again", async () => {
    const fetch = jest.fn().mockResolvedValueOnce("before").mockResolvedValueOnce("after");

    await sharedTokenAccounts(ENDPOINT, SPL, OWNER, fetch);
    advance(SHARED_TOKEN_ACCOUNTS_TTL_MS - 1);
    await expect(sharedTokenAccounts(ENDPOINT, SPL, OWNER, fetch)).resolves.toBe("before");

    advance(2);
    await expect(sharedTokenAccounts(ENDPOINT, SPL, OWNER, fetch)).resolves.toBe("after");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("stops handing out a lookup that never settles after the window", async () => {
    const hung = jest.fn(() => new Promise<string>(() => {}));
    const fresh = jest.fn().mockResolvedValue("fresh");

    void sharedTokenAccounts(ENDPOINT, SPL, OWNER, hung);
    advance(SHARED_TOKEN_ACCOUNTS_TTL_MS + 1);

    await expect(sharedTokenAccounts(ENDPOINT, SPL, OWNER, fresh)).resolves.toBe("fresh");
    expect(hung).toHaveBeenCalledTimes(1);
  });

  it("does not keep a failed lookup", async () => {
    const fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error("rpc down"))
      .mockResolvedValueOnce("accounts");

    await expect(sharedTokenAccounts(ENDPOINT, SPL, OWNER, fetch)).rejects.toThrow("rpc down");
    await expect(sharedTokenAccounts(ENDPOINT, SPL, OWNER, fetch)).resolves.toBe("accounts");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("keeps endpoints, token programs and owners apart", async () => {
    const fetch = jest.fn().mockResolvedValue("accounts");

    await sharedTokenAccounts(ENDPOINT, SPL, OWNER, fetch);
    await sharedTokenAccounts(ENDPOINT, TOKEN_2022, OWNER, fetch);
    await sharedTokenAccounts("https://other.example.com", SPL, OWNER, fetch);
    await sharedTokenAccounts(ENDPOINT, SPL, "AjmMiagw33Ad4WdPR3y2QWsDXaLxmsiSZEpMfpT1Q9uZ", fetch);

    expect(fetch).toHaveBeenCalledTimes(4);
  });

  it("evicts the least recently used lookup past the maximum", async () => {
    const fetch = jest.fn((): Promise<string> => Promise.resolve("accounts"));

    await sharedTokenAccounts(ENDPOINT, SPL, "owner-0", fetch);
    for (let i = 1; i <= SHARED_TOKEN_ACCOUNTS_MAX; i++) {
      await sharedTokenAccounts(ENDPOINT, SPL, `owner-${i}`, fetch);
    }
    expect(fetch).toHaveBeenCalledTimes(SHARED_TOKEN_ACCOUNTS_MAX + 1);

    // owner-0 was the least recently used: it is read again; owner-1..MAX are still kept.
    await sharedTokenAccounts(ENDPOINT, SPL, "owner-0", fetch);
    expect(fetch).toHaveBeenCalledTimes(SHARED_TOKEN_ACCOUNTS_MAX + 2);
    await sharedTokenAccounts(ENDPOINT, SPL, `owner-${SHARED_TOKEN_ACCOUNTS_MAX}`, fetch);
    expect(fetch).toHaveBeenCalledTimes(SHARED_TOKEN_ACCOUNTS_MAX + 2);
  });

  it("gives each caller its own copy, so parsing one does not change the others", async () => {
    const pubkey = new PublicKey(OWNER);
    const response = {
      context: { slot: 1 },
      value: [
        {
          pubkey,
          account: {
            owner: pubkey,
            data: {
              parsed: {
                info: {
                  mint: SPL,
                  owner: OWNER,
                  isNative: false,
                  state: "initialized",
                  tokenAmount: {
                    amount: "1",
                    decimals: 6,
                    uiAmount: 0.000001,
                    uiAmountString: "0.000001",
                  },
                },
              },
            },
          },
        },
      ],
    };
    const fetch = jest.fn((): Promise<typeof response> => Promise.resolve(response));

    const first = await sharedTokenAccounts(ENDPOINT, SPL, OWNER, fetch);
    // What superstruct `create` does to the response in `parseTokenAccountInfo`.
    parseTokenAccountInfo(first.value[0].account.data.parsed.info);
    expect(first.value[0].account.data.parsed.info.mint).toBeInstanceOf(PublicKey);

    const second = await sharedTokenAccounts(ENDPOINT, SPL, OWNER, fetch);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(second.value[0].account.data.parsed.info.mint).toBe(SPL);
    expect(second.value[0].pubkey).toBe(pubkey);
    expect(second).toEqual(response);
  });

  it("reads again after a clear", async () => {
    const fetch = jest.fn().mockResolvedValueOnce("before").mockResolvedValueOnce("after");

    await sharedTokenAccounts(ENDPOINT, SPL, OWNER, fetch);
    clearSharedTokenAccounts();

    await expect(sharedTokenAccounts(ENDPOINT, SPL, OWNER, fetch)).resolves.toBe("after");
  });

  it("does not let a lookup cleared in flight overwrite a newer one", async () => {
    let resolveOld!: (value: string) => void;
    const old = jest.fn(() => new Promise<string>(r => (resolveOld = r)));
    const fresh = jest.fn().mockResolvedValue("fresh");

    const pendingOld = sharedTokenAccounts(ENDPOINT, SPL, OWNER, old);
    clearSharedTokenAccounts();
    await expect(sharedTokenAccounts(ENDPOINT, SPL, OWNER, fresh)).resolves.toBe("fresh");
    resolveOld("stale");
    await pendingOld;

    await expect(sharedTokenAccounts(ENDPOINT, SPL, OWNER, old)).resolves.toBe("fresh");
  });
});

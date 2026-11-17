import {
  clearSharedTokenAccounts,
  SHARED_TOKEN_ACCOUNTS_TTL_MS,
  sharedTokenAccounts,
} from "./sharedTokenAccounts";

const ENDPOINT = "https://solana.example.com";
const SPL = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const TOKEN_2022 = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
const OWNER = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";

describe("sharedTokenAccounts", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    clearSharedTokenAccounts();
  });

  afterEach(() => {
    jest.useRealTimers();
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

  it("reuses a resolved lookup within the window, then reads again", async () => {
    const fetch = jest.fn().mockResolvedValueOnce("before").mockResolvedValueOnce("after");

    await sharedTokenAccounts(ENDPOINT, SPL, OWNER, fetch);
    jest.advanceTimersByTime(SHARED_TOKEN_ACCOUNTS_TTL_MS - 1);
    await expect(sharedTokenAccounts(ENDPOINT, SPL, OWNER, fetch)).resolves.toBe("before");

    jest.advanceTimersByTime(1);
    await expect(sharedTokenAccounts(ENDPOINT, SPL, OWNER, fetch)).resolves.toBe("after");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("starts the window when the lookup resolves, not when it starts", async () => {
    let resolve!: (value: string) => void;
    const slow = jest.fn(() => new Promise<string>(r => (resolve = r)));

    const pending = sharedTokenAccounts(ENDPOINT, SPL, OWNER, slow);
    jest.advanceTimersByTime(SHARED_TOKEN_ACCOUNTS_TTL_MS * 2);
    resolve("accounts");
    await pending;

    jest.advanceTimersByTime(SHARED_TOKEN_ACCOUNTS_TTL_MS - 1);
    await sharedTokenAccounts(ENDPOINT, SPL, OWNER, slow);
    expect(slow).toHaveBeenCalledTimes(1);
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

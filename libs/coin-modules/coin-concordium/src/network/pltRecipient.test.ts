import { fetchAccountTokens, fetchPltModuleState } from "./pltRecipient";
import { createFixtureConfig, createFixtureContext } from "../test/fixtures";

jest.mock("./proxyClient", () => ({
  getAccountBalance: jest.fn(),
  getPltTokenInfo: jest.fn(),
}));

const { getAccountBalance, getPltTokenInfo } = jest.requireMock("./proxyClient");

const context = createFixtureContext();

// The caches are module state, so every case uses an address or token of its
// own rather than trying to reset them between tests.
let unique = 0;
const nextAddress = () => `address-${unique++}`;
const nextToken = () => `token-${unique++}`;

beforeEach(() => jest.clearAllMocks());

/** A shape `readAccountTokens` accepts, so cases can vary one thing at a time. */
const entry = (tokenId: string) => ({
  token: { tokenId, tokenState: { moduleState: {} } },
  tokenAccountState: { balance: { value: "500", decimals: 6 } },
});

describe("fetchAccountTokens", () => {
  it("reads the token list of an account that exists", async () => {
    const entries = [entry("UPEU")];
    getAccountBalance.mockResolvedValue({
      finalizedBalance: { accountAmount: "1", accountTokens: entries },
    });

    await expect(fetchAccountTokens({ context, address: nextAddress() })).resolves.toEqual({
      status: "readable",
      entries,
    });
  });

  it("reports an address that does not exist as absent, not as empty", async () => {
    getAccountBalance.mockResolvedValue({});

    await expect(fetchAccountTokens({ context, address: nextAddress() })).resolves.toEqual({
      status: "absent",
    });
  });

  it("distinguishes an existing account holding nothing", async () => {
    getAccountBalance.mockResolvedValue({
      finalizedBalance: { accountAmount: "0", accountTokens: [] },
    });

    await expect(fetchAccountTokens({ context, address: nextAddress() })).resolves.toEqual({
      status: "readable",
      entries: [],
    });
  });

  // The boundary is where a malformed response stops. Downstream reads absence
  // as "not on this list", which under a deny list means allowed — so a response
  // that cannot be read must not arrive there looking empty.
  it.each([
    ["the token list is absent", { accountAmount: "1" }],
    ["the token list is not an array", { accountAmount: "1", accountTokens: {} }],
    ["an entry is null", { accountAmount: "1", accountTokens: [null] }],
    ["an entry has an empty tokenId", { accountAmount: "1", accountTokens: [entry("")] }],
    [
      "an entry has no tokenAccountState",
      { accountAmount: "1", accountTokens: [{ token: { tokenId: "UPEU" } }] },
    ],
    [
      "an entry carries no balance",
      { accountAmount: "1", accountTokens: [{ ...entry("UPEU"), tokenAccountState: {} }] },
    ],
  ])("reports the response as unreadable when %s", async (_label, finalizedBalance) => {
    getAccountBalance.mockResolvedValue({ finalizedBalance });

    await expect(fetchAccountTokens({ context, address: nextAddress() })).resolves.toEqual({
      status: "unreadable",
    });
  });

  // `getTransactionStatus` re-runs on every keystroke, so a repeated address
  // must not spend a request each time.
  it("serves a repeated address from the cache", async () => {
    const address = nextAddress();
    getAccountBalance.mockResolvedValue({
      finalizedBalance: { accountAmount: "1", accountTokens: [] },
    });

    await fetchAccountTokens({ context, address });
    await fetchAccountTokens({ context, address });

    expect(getAccountBalance).toHaveBeenCalledTimes(1);
  });

  it("keys the cache on the endpoint, not on the context object", async () => {
    const address = nextAddress();
    getAccountBalance.mockResolvedValue({
      finalizedBalance: { accountAmount: "1", accountTokens: [] },
    });

    await fetchAccountTokens({ context: createFixtureContext(), address });
    await fetchAccountTokens({ context: createFixtureContext(), address });

    expect(getAccountBalance).toHaveBeenCalledTimes(1);
  });

  it("fetches through a context pinned to the resolved config", async () => {
    const address = nextAddress();
    getAccountBalance.mockResolvedValue({});
    const logger = jest.fn();

    await fetchAccountTokens({ context: { ...createFixtureContext(), logger }, address });

    const [fetchContext] = getAccountBalance.mock.calls[0];
    expect(fetchContext.logger).toBe(logger);
    await expect(fetchContext.config()).resolves.toEqual(createFixtureConfig());
    await expect(fetchContext.config("another_currency")).resolves.toEqual(createFixtureConfig());
  });

  it("does not serve one endpoint's answer for another", async () => {
    const address = nextAddress();
    getAccountBalance.mockResolvedValueOnce({});
    getAccountBalance.mockResolvedValueOnce({
      finalizedBalance: { accountAmount: "1", accountTokens: [] },
    });

    await expect(
      fetchAccountTokens({
        context: createFixtureContext({ proxyUrl: "https://a" }),
        address,
      }),
    ).resolves.toEqual({ status: "absent" });
    await expect(
      fetchAccountTokens({
        context: createFixtureContext({ proxyUrl: "https://b" }),
        address,
      }),
    ).resolves.toEqual({ status: "readable", entries: [] });
  });

  it("reads the TTL from the coin config", async () => {
    const address = nextAddress();
    const shortTtl = createFixtureContext({
      gateway: { ...createFixtureConfig().gateway, accountTokensCacheTtlMs: 1 },
    });
    getAccountBalance.mockResolvedValue({
      finalizedBalance: { accountAmount: "1", accountTokens: [] },
    });

    await fetchAccountTokens({ context: shortTtl, address });
    await new Promise(resolve => setTimeout(resolve, 20));
    await fetchAccountTokens({ context: shortTtl, address });

    expect(getAccountBalance).toHaveBeenCalledTimes(2);
  });

  it("does not cache a failure", async () => {
    const address = nextAddress();
    getAccountBalance.mockRejectedValueOnce(new Error("proxy unreachable"));
    getAccountBalance.mockResolvedValueOnce({
      finalizedBalance: { accountAmount: "2", accountTokens: [] },
    });

    await expect(fetchAccountTokens({ context, address })).rejects.toThrow("proxy unreachable");
    await expect(fetchAccountTokens({ context, address })).resolves.toEqual({
      status: "readable",
      entries: [],
    });
  });
});

describe("fetchPltModuleState", () => {
  it("returns the token's module state", async () => {
    const moduleState = { allowList: true, denyList: false };
    getPltTokenInfo.mockResolvedValue({ tokenState: { moduleState } });

    await expect(fetchPltModuleState({ context, tokenId: nextToken() })).resolves.toEqual(
      moduleState,
    );
  });

  // Rejected here rather than passed on, so no caller has to remember to.
  it.each([
    ["the hex fallback", "a1696a6c6c6f77"],
    ["a non-boolean flag", { denyList: "true" }],
  ])("reports %s as unreadable", async (_label, moduleState) => {
    getPltTokenInfo.mockResolvedValue({ tokenState: { moduleState } });

    await expect(fetchPltModuleState({ context, tokenId: nextToken() })).resolves.toBeUndefined();
  });

  it("serves a repeated token from the cache", async () => {
    const tokenId = nextToken();
    getPltTokenInfo.mockResolvedValue({ tokenState: { moduleState: {} } });

    await fetchPltModuleState({ context, tokenId });
    await fetchPltModuleState({ context, tokenId });

    expect(getPltTokenInfo).toHaveBeenCalledTimes(1);
  });
});

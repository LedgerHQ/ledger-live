import { fetchAccountTokens, fetchPltModuleState } from "./pltRecipient";
import type { ConcordiumCoinConfig } from "../types";

jest.mock("./proxyClient", () => ({
  getAccountBalance: jest.fn(),
  getPltTokenInfo: jest.fn(),
}));

const { getAccountBalance, getPltTokenInfo } = jest.requireMock("./proxyClient");

const config = {} as ConcordiumCoinConfig;
const currencyId = "concordium_testnet";

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

    await expect(
      fetchAccountTokens({ config, currencyId, address: nextAddress() }),
    ).resolves.toEqual({ status: "readable", entries });
  });

  it("reports an address that does not exist as absent, not as empty", async () => {
    getAccountBalance.mockResolvedValue({});

    await expect(
      fetchAccountTokens({ config, currencyId, address: nextAddress() }),
    ).resolves.toEqual({ status: "absent" });
  });

  it("distinguishes an existing account holding nothing", async () => {
    getAccountBalance.mockResolvedValue({
      finalizedBalance: { accountAmount: "0", accountTokens: [] },
    });

    await expect(
      fetchAccountTokens({ config, currencyId, address: nextAddress() }),
    ).resolves.toEqual({ status: "readable", entries: [] });
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

    await expect(
      fetchAccountTokens({ config, currencyId, address: nextAddress() }),
    ).resolves.toEqual({ status: "unreadable" });
  });

  // `getTransactionStatus` re-runs on every keystroke, so a repeated address
  // must not spend a request each time.
  it("serves a repeated address from the cache", async () => {
    const address = nextAddress();
    getAccountBalance.mockResolvedValue({
      finalizedBalance: { accountAmount: "1", accountTokens: [] },
    });

    await fetchAccountTokens({ config, currencyId, address });
    await fetchAccountTokens({ config, currencyId, address });

    expect(getAccountBalance).toHaveBeenCalledTimes(1);
  });

  it("does not cache a failure", async () => {
    const address = nextAddress();
    getAccountBalance.mockRejectedValueOnce(new Error("proxy unreachable"));
    getAccountBalance.mockResolvedValueOnce({
      finalizedBalance: { accountAmount: "2", accountTokens: [] },
    });

    await expect(fetchAccountTokens({ config, currencyId, address })).rejects.toThrow(
      "proxy unreachable",
    );
    await expect(fetchAccountTokens({ config, currencyId, address })).resolves.toEqual({
      status: "readable",
      entries: [],
    });
  });
});

describe("fetchPltModuleState", () => {
  it("returns the token's module state", async () => {
    const moduleState = { allowList: true, denyList: false };
    getPltTokenInfo.mockResolvedValue({ tokenState: { moduleState } });

    await expect(
      fetchPltModuleState({ config, currencyId, tokenId: nextToken() }),
    ).resolves.toEqual(moduleState);
  });

  // Rejected here rather than passed on, so no caller has to remember to.
  it.each([
    ["the hex fallback", "a1696a6c6c6f77"],
    ["a non-boolean flag", { denyList: "true" }],
  ])("reports %s as unreadable", async (_label, moduleState) => {
    getPltTokenInfo.mockResolvedValue({ tokenState: { moduleState } });

    await expect(
      fetchPltModuleState({ config, currencyId, tokenId: nextToken() }),
    ).resolves.toBeUndefined();
  });

  it("serves a repeated token from the cache", async () => {
    const tokenId = nextToken();
    getPltTokenInfo.mockResolvedValue({ tokenState: { moduleState: {} } });

    await fetchPltModuleState({ config, currencyId, tokenId });
    await fetchPltModuleState({ config, currencyId, tokenId });

    expect(getPltTokenInfo).toHaveBeenCalledTimes(1);
  });
});

import { createFixtureConfig } from "../../test/fixtures";
import {
  clearCanonicalAddressCache,
  toCanonicalAddress,
  toCanonicalAddresses,
} from "./canonicalAddress";

jest.mock("../../network/proxyClient", () => ({
  getAccountCanonicalAddress: jest.fn(),
}));

const { getAccountCanonicalAddress: getAccountCanonicalAddressMock } = jest.requireMock(
  "../../network/proxyClient",
);

const config = createFixtureConfig();
const CURRENCY = "concordium";

// Two aliases of one mainnet account, and its canonical address.
const ALIAS = "4DAERy94ScrVZQPLyqV9bGF9kT8kDSUS8M5Y4Epmew49ZXjfnk";
const OTHER_ALIAS = "4DAERy94ScrVZQPLyqV9bGF9kT8kDSUS8M5Y4EpmccZy1BbHGS";
const CANONICAL = "4DAERy94ScrVZQPLyqV9bGF9kT8kDSUS8M5Y4EpmdNS2q4LmLd";
const OTHER_ACCOUNT = "3WD5VXRzZwwkQyLBjxb1qonF8E5GKRe1uBN6g3WCE8XrGuXuwu";

/** As `@ledgerhq/live-network` throws it. */
const httpError = (status: number, message: string) =>
  Object.assign(new Error(message), { status });

describe("toCanonicalAddress", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearCanonicalAddressCache();
  });

  it("resolves an alias to the canonical address of its account", async () => {
    getAccountCanonicalAddressMock.mockResolvedValue({ accountAddress: CANONICAL });

    await expect(toCanonicalAddress(config, CURRENCY, ALIAS)).resolves.toBe(CANONICAL);
    expect(getAccountCanonicalAddressMock).toHaveBeenCalledWith(config, CURRENCY, ALIAS);
  });

  it("asks once per account, whatever alias is given", async () => {
    getAccountCanonicalAddressMock.mockResolvedValue({ accountAddress: CANONICAL });

    await toCanonicalAddress(config, CURRENCY, ALIAS);
    await expect(toCanonicalAddress(config, CURRENCY, OTHER_ALIAS)).resolves.toBe(CANONICAL);
    await expect(toCanonicalAddress(config, CURRENCY, CANONICAL)).resolves.toBe(CANONICAL);

    expect(getAccountCanonicalAddressMock).toHaveBeenCalledTimes(1);
  });

  it("asks again for another network", async () => {
    getAccountCanonicalAddressMock.mockResolvedValue({ accountAddress: CANONICAL });

    await toCanonicalAddress(config, CURRENCY, ALIAS);
    await toCanonicalAddress(config, "concordium_testnet", ALIAS);

    expect(getAccountCanonicalAddressMock).toHaveBeenCalledTimes(2);
  });

  it("keeps anything but an account address, without asking", async () => {
    await expect(toCanonicalAddress(config, CURRENCY, "not-an-address")).resolves.toBe(
      "not-an-address",
    );
    expect(getAccountCanonicalAddressMock).not.toHaveBeenCalled();
  });

  it("keeps the address of an account not finalized yet, and asks again next time", async () => {
    getAccountCanonicalAddressMock
      .mockRejectedValueOnce(httpError(404, "Account does not exist"))
      .mockResolvedValueOnce({ accountAddress: CANONICAL });

    await expect(toCanonicalAddress(config, CURRENCY, ALIAS)).resolves.toBe(ALIAS);
    await expect(toCanonicalAddress(config, CURRENCY, ALIAS)).resolves.toBe(CANONICAL);
  });

  it("fails on a proxy without the endpoint, and asks again next time", async () => {
    getAccountCanonicalAddressMock
      .mockRejectedValueOnce(httpError(404, "Not found"))
      .mockResolvedValueOnce({ accountAddress: CANONICAL });

    await expect(toCanonicalAddress(config, CURRENCY, ALIAS)).rejects.toThrow("Not found");
    await expect(toCanonicalAddress(config, CURRENCY, ALIAS)).resolves.toBe(CANONICAL);
  });
});

describe("toCanonicalAddresses", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearCanonicalAddressCache();
  });

  it("maps each distinct address to its canonical address", async () => {
    getAccountCanonicalAddressMock.mockImplementation(
      async (_config: unknown, _currency: string, address: string) => ({
        accountAddress: address === OTHER_ACCOUNT ? OTHER_ACCOUNT : CANONICAL,
      }),
    );

    const result = await toCanonicalAddresses(config, CURRENCY, [
      ALIAS,
      OTHER_ACCOUNT,
      ALIAS,
      OTHER_ALIAS,
    ]);

    expect(result).toEqual(
      new Map([
        [ALIAS, CANONICAL],
        [OTHER_ACCOUNT, OTHER_ACCOUNT],
        [OTHER_ALIAS, CANONICAL],
      ]),
    );
  });
});

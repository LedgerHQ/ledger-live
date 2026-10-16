import { lastValueFrom, toArray } from "rxjs";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { createEmptyHistoryCache } from "@ledgerhq/ledger-wallet-framework/account/balanceHistoryCache";
import { getCoinFrameworkCurrencyBridge } from "../currencyBridge";
import { getSigner } from "../signer";
import type { CoinFrameworkSigner } from "../types";
import { mockLiveConfig } from "./portfolioFixtures";

jest.mock("../signer", () => ({ getSigner: jest.fn() }));

const getBridgeApiMock = jest.fn();
jest.mock("../bridge", () => ({
  getBridgeApi: (...a: unknown[]) => getBridgeApiMock(...a),
  getBridgeApiResolver: async () => () => ({}),
}));

const getAddressesForPublicKey = jest.fn();
jest.mock("../api", () => ({
  getCoinModuleApi: async () => ({ getAddressesForPublicKey }),
}));

jest.mock("../getAccountShape", () => ({
  genericGetAccountShape: () => async (info: { address: string }) => ({
    id: `acc-${info.address}`,
    used: true,
    balanceHistoryCache: createEmptyHistoryCache(),
  }),
}));

const stubSigner: CoinFrameworkSigner = {
  getAddress: async (_deviceId, { path }) => ({ address: "addr", path, publicKey: "pub" }),
  context: async (_deviceId, fn) => fn(undefined),
};

async function scan(bridgeSigner?: CoinFrameworkSigner) {
  const currency = getCryptoCurrencyById("hedera");
  const bridge = await getCoinFrameworkCurrencyBridge("hedera", "local", bridgeSigner);
  return lastValueFrom(
    bridge
      .scanAccounts({ currency, deviceId: "deviceId", syncConfig: { paginationConfig: {} } })
      .pipe(toArray()),
  );
}

describe("getCoinFrameworkCurrencyBridge — scan address lookup wiring", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("scans the addresses the network bridge looks up for the device key", async () => {
    const currency = getCryptoCurrencyById("hedera");
    const getAddresses = jest.fn().mockResolvedValue(["0.0.1", "0.0.2"]);
    getBridgeApiMock.mockResolvedValue({
      addressLookup: { getAddresses, keyControlsAccount: () => true },
    });
    const bridge = await getCoinFrameworkCurrencyBridge("hedera", "local", stubSigner);

    const events = await lastValueFrom(
      bridge
        .scanAccounts({ currency, deviceId: "deviceId", syncConfig: { paginationConfig: {} } })
        .pipe(toArray()),
    );

    expect(events.map(e => e.account.freshAddress)).toEqual(["0.0.1", "0.0.2"]);
    // The lookup reads the chain of the currency's path: the coin module on the legacy one.
    const [derived, chain] = getAddresses.mock.calls[0];
    expect(derived).toMatchObject({ publicKey: "pub" });
    getAddressesForPublicKey.mockResolvedValue(["0.0.3"]);
    await expect(chain.getAddressesForPublicKey("pub")).resolves.toEqual(["0.0.3"]);
    expect(getAddressesForPublicKey).toHaveBeenCalledWith(expect.anything(), "pub");
    expect(getBridgeApiMock).toHaveBeenCalledWith(currency, "hedera");
  });

  it("scans the device addresses of a family without address lookup", async () => {
    const currency = getCryptoCurrencyById("hedera");
    getBridgeApiMock.mockResolvedValue({});
    const bridge = await getCoinFrameworkCurrencyBridge("hedera", "local", stubSigner);

    const events = await lastValueFrom(
      bridge
        .scanAccounts({ currency, deviceId: "deviceId", syncConfig: { paginationConfig: {} } })
        .pipe(toArray()),
    );

    expect(events.length).toBeGreaterThan(0);
    expect(getAddressesForPublicKey).not.toHaveBeenCalled();
  });
});

describe("getCoinFrameworkCurrencyBridge — signer and portfolio lookup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => jest.restoreAllMocks());

  it("scans with the network's own signer when none is given", async () => {
    jest.mocked(getSigner).mockResolvedValue(stubSigner);
    getBridgeApiMock.mockResolvedValue({});

    expect((await scan()).length).toBeGreaterThan(0);
    expect(getSigner).toHaveBeenCalledWith("hedera");
  });

  it("looks the addresses up through the portfolio when the coin config enables it", async () => {
    mockLiveConfig({
      config_portfolio_service: { url: "" },
      config_currency_hedera: { portfolio: { enabled: true, mode: "local" } },
    });
    const getAddresses = jest.fn(async (derived: { publicKey: string }, chain) =>
      chain.getAddressesForPublicKey(derived.publicKey),
    );
    getBridgeApiMock.mockResolvedValue({
      addressLookup: { getAddresses, keyControlsAccount: () => true },
    });
    getAddressesForPublicKey.mockResolvedValue(["0.0.7"]);

    const events = await scan(stubSigner);

    expect(events.map(e => e.account.freshAddress)).toEqual(["0.0.7"]);
    // The local side asked its coin module (the scan opened the currency's network portfolio).
    expect(getAddressesForPublicKey).toHaveBeenCalledWith(expect.anything(), "pub");
  });
});

import { lastValueFrom, toArray } from "rxjs";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { createEmptyHistoryCache } from "@ledgerhq/ledger-wallet-framework/account/balanceHistoryCache";
import { getCoinFrameworkCurrencyBridge } from "../currencyBridge";
import type { CoinFrameworkSigner } from "../types";

const getBridgeApiMock = jest.fn();
jest.mock("../bridge", () => ({
  getBridgeApi: (...a: unknown[]) => getBridgeApiMock(...a),
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
    expect(getBridgeApiMock).toHaveBeenCalledTimes(1);
    expect(getBridgeApiMock).toHaveBeenCalledWith(currency, "hedera");
  });
});

import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  makeScanAccounts,
  makeSync,
  getSerializedAddressParameters,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import type { Account } from "@ledgerhq/types-live";
import { getCoinFrameworkAccountBridge } from "../accountBridge";
import { getCoinFrameworkCurrencyBridge } from "../currencyBridge";
import { postSync as genericPostSync } from "../postSync";
import type { CoinFrameworkSigner } from "../types";

jest.mock("@ledgerhq/ledger-wallet-framework/bridge/jsHelpers", () => ({
  ...jest.requireActual("@ledgerhq/ledger-wallet-framework/bridge/jsHelpers"),
  makeSync: jest.fn(),
  makeScanAccounts: jest.fn(),
  getSerializedAddressParameters: jest.fn(() => Buffer.from("generic")),
}));
jest.mock("../postSync", () => ({ postSync: jest.fn((_, synced) => synced) }));

const resolveBridgeApi = jest.fn();
jest.mock("../bridge", () => ({
  getBridgeApi: jest.fn(async () => ({})),
  getBridgeApiResolver: jest.fn(async () => resolveBridgeApi),
}));
jest.mock("../accountRawAssign", () => ({ getAccountRawAssignHooks: jest.fn(async () => ({})) }));

const signer: CoinFrameworkSigner = {
  getAddress: jest.fn(),
  context: jest.fn(),
};
const bitcoin = getCryptoCurrencyById("bitcoin");
const initial = { currency: bitcoin } as Account;
const synced = { currency: bitcoin, synced: true } as unknown as Account;

const capturedPostSync = (mock: jest.Mock) =>
  mock.mock.calls[mock.mock.calls.length - 1][0].postSync as (a: Account, b: Account) => Account;

beforeEach(() => jest.clearAllMocks());

describe.each([
  ["account bridge", () => getCoinFrameworkAccountBridge("bitcoin", "local", signer), makeSync],
  ["currency bridge", () => getCoinFrameworkCurrencyBridge("bitcoin", "local", signer), makeScanAccounts],
])("%s post-sync", (_name, build, helper) => {
  it("is the family's when it has an account layer", async () => {
    const familyPostSync = jest.fn(() => ({ fromFamily: true }) as unknown as Account);
    resolveBridgeApi.mockReturnValue({ accountLayer: { postSync: familyPostSync } });
    await build();
    expect(capturedPostSync(helper as jest.Mock)(initial, synced)).toEqual({ fromFamily: true });
    expect(familyPostSync).toHaveBeenCalledWith(initial, synced);
    expect(resolveBridgeApi).toHaveBeenCalledWith(bitcoin);
    expect(genericPostSync).not.toHaveBeenCalled();
  });

  it("is the generic one otherwise", async () => {
    resolveBridgeApi.mockReturnValue({});
    await build();
    expect(capturedPostSync(helper as jest.Mock)(initial, synced)).toBe(synced);
    expect(genericPostSync).toHaveBeenCalledWith(initial, synced);
  });
});

describe("account bridge serialized address parameters", () => {
  it("are the family's when it declares them", async () => {
    const fromFamily = jest.fn(() => Buffer.from("family"));
    resolveBridgeApi.mockReturnValue({
      accountLayer: { getSerializedAddressParameters: fromFamily },
    });
    const bridge = await getCoinFrameworkAccountBridge("bitcoin", "local", signer);
    expect(bridge.getSerializedAddressParameters(initial, "bech32")).toEqual(Buffer.from("family"));
    expect(fromFamily).toHaveBeenCalledWith(initial, "bech32");
  });

  it("are the generic ones otherwise", async () => {
    resolveBridgeApi.mockReturnValue({});
    const bridge = await getCoinFrameworkAccountBridge("bitcoin", "local", signer);
    expect(bridge.getSerializedAddressParameters(initial)).toEqual(Buffer.from("generic"));
    expect(getSerializedAddressParameters).toHaveBeenCalledWith(initial);
  });
});

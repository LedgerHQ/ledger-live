/**
 * The Zcash-specific hooks the host apps reach for by name: the UFVK export
 * flow calls `getFullViewingKey` on the bridge, and the flows that price a
 * transaction before a recipient exists call `getEstimationRecipient` (whose
 * live-common default throws).
 */
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { createBridges } from "./index";
import { ZCASH_ESTIMATION_RECIPIENT } from "../constants";
import type { SignerContext } from "../types/signer";
import type { ZcashAccount } from "../types/bridge";
import { getZCashClient } from "../logic/engineClient";

jest.mock("../logic/engineClient", () => ({ getZCashClient: jest.fn() }));
const mockedGetZCashClient = jest.mocked(getZCashClient);

const currency = getCryptoCurrencyById("zcash");
const coinConfig = () => ({ info: { status: { type: "active" as const } } });

const account = {
  currency,
  freshAddressPath: "44'/133'/0'/0/4",
} as unknown as ZcashAccount;

function makeSignerContext(getFullViewingKey: jest.Mock): SignerContext {
  return jest.fn(async (_deviceId, fn) => fn({ getFullViewingKey })) as unknown as SignerContext;
}

describe("createBridges", () => {
  it("exposes getFullViewingKey, defaulting the path to the account's fresh address path", async () => {
    const getFullViewingKey = jest.fn().mockResolvedValue({ viewKey: "uview1test" });
    const { accountBridge } = createBridges(makeSignerContext(getFullViewingKey), coinConfig);

    await expect(
      accountBridge.getFullViewingKey(account, { deviceId: "device-1" }),
    ).resolves.toEqual({ viewKey: "uview1test", path: "44'/133'/0'/0/4" });
    expect(getFullViewingKey).toHaveBeenCalledWith("44'/133'/0'/0/4");
  });

  it("honours an explicit path", async () => {
    const getFullViewingKey = jest.fn().mockResolvedValue({ viewKey: "uview1other" });
    const { accountBridge } = createBridges(makeSignerContext(getFullViewingKey), coinConfig);

    await accountBridge.getFullViewingKey(account, { deviceId: "device-1", path: "m/32'/133'/1'" });

    expect(getFullViewingKey).toHaveBeenCalledWith("m/32'/133'/1'");
  });

  it("exposes an estimation recipient", () => {
    const { accountBridge } = createBridges(makeSignerContext(jest.fn()), coinConfig);

    expect(accountBridge.getEstimationRecipient?.(account)).toBe(ZCASH_ESTIMATION_RECIPIENT);
  });

  it("exposes deriveShieldedAddress, delegating to getZCashClient", async () => {
    const deriveShieldedAddress = jest.fn().mockResolvedValue("u1derived");
    mockedGetZCashClient.mockResolvedValue({ deriveShieldedAddress } as any);
    const { accountBridge } = createBridges(makeSignerContext(jest.fn()), coinConfig);

    const result = await accountBridge.deriveShieldedAddress!("uview1testufvk");

    expect(deriveShieldedAddress).toHaveBeenCalledWith("uview1testufvk");
    expect(result).toBe("u1derived");
  });

  it("getShieldedAddress delegates to the signer with the account's freshAddressPath by default", async () => {
    const getShieldedAddress = jest.fn().mockResolvedValue({ address: "u1testunified" });
    const signerContext: SignerContext = jest.fn(async (_deviceId, fn) =>
      fn({ getShieldedAddress }),
    ) as unknown as SignerContext;
    const { accountBridge } = createBridges(signerContext, coinConfig);

    const result = await accountBridge.getShieldedAddress(account, { deviceId: "device-1" });

    expect(result).toEqual({ address: "u1testunified" });
    expect(getShieldedAddress).toHaveBeenCalledWith("44'/133'/0'/0/4", undefined);
  });

  it("getShieldedAddress passes display=true when requested", async () => {
    const getShieldedAddress = jest.fn().mockResolvedValue({ address: "u1testunified" });
    const signerContext: SignerContext = jest.fn(async (_deviceId, fn) =>
      fn({ getShieldedAddress }),
    ) as unknown as SignerContext;
    const { accountBridge } = createBridges(signerContext, coinConfig);

    await accountBridge.getShieldedAddress(account, { deviceId: "device-1", display: true });

    expect(getShieldedAddress).toHaveBeenCalledWith("44'/133'/0'/0/4", true);
  });
});

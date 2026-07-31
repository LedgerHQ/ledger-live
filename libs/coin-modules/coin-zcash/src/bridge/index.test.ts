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

const currency = getCryptoCurrencyById("zcash");
const coinConfig = () => ({ info: { status: { type: "active" as const } } });

const account = {
  currency,
  freshAddressPath: "m/32'/133'/0'",
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
    ).resolves.toEqual({ viewKey: "uview1test", path: "m/32'/133'/0'" });
    expect(getFullViewingKey).toHaveBeenCalledWith("m/32'/133'/0'");
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
});

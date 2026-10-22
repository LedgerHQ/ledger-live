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
import { firstValueFrom, of } from "rxjs";
import { DeviceModelId } from "@ledgerhq/devices";
import type { SignOperationEvent } from "@ledgerhq/types-live";
import { ZcashShieldedNotSupportedOnDevice } from "../types/errors";
import { buildSignOperation } from "./signOperation";
import { buildLegacySignOperation, buildPreparedLegacySignOperation } from "../legacy";
import { getZCashClient } from "../logic/engineClient";
import { testContext } from "../test/coinConfig";

jest.mock("../logic/engineClient", () => ({ getZCashClient: jest.fn() }));

// Each builder returns its own marker function, so a test can tell which one served the call.
const shieldedSign = jest.fn(() => of({ type: "shielded" } as unknown as SignOperationEvent));
const legacySign = jest.fn(() => of({ type: "legacy" } as unknown as SignOperationEvent));
const nanoSSign = jest.fn(() => of({ type: "nanoS" } as unknown as SignOperationEvent));
jest.mock("./signOperation", () => ({ buildSignOperation: jest.fn(() => shieldedSign) }));
jest.mock("../legacy", () => ({
  ...jest.requireActual("../legacy"),
  buildLegacySignOperation: jest.fn(() => legacySign),
  buildPreparedLegacySignOperation: jest.fn(() => nanoSSign),
}));
const mockedGetZCashClient = jest.mocked(getZCashClient);

const currency = getCryptoCurrencyById("zcash");

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
    const { accountBridge } = createBridges(makeSignerContext(getFullViewingKey), testContext);

    await expect(
      accountBridge.getFullViewingKey(account, { deviceId: "device-1" }),
    ).resolves.toEqual({ viewKey: "uview1test", path: "44'/133'/0'/0/4" });
    expect(getFullViewingKey).toHaveBeenCalledWith("44'/133'/0'/0/4");
  });

  it("honours an explicit path", async () => {
    const getFullViewingKey = jest.fn().mockResolvedValue({ viewKey: "uview1other" });
    const { accountBridge } = createBridges(makeSignerContext(getFullViewingKey), testContext);

    await accountBridge.getFullViewingKey(account, { deviceId: "device-1", path: "m/32'/133'/1'" });

    expect(getFullViewingKey).toHaveBeenCalledWith("m/32'/133'/1'");
  });

  it("exposes an estimation recipient", () => {
    const { accountBridge } = createBridges(makeSignerContext(jest.fn()), testContext);

    expect(accountBridge.getEstimationRecipient?.(account)).toBe(ZCASH_ESTIMATION_RECIPIENT);
  });

  it("exposes deriveShieldedAddress, delegating to getZCashClient", async () => {
    const deriveShieldedAddress = jest.fn().mockResolvedValue("u1derived");
    mockedGetZCashClient.mockResolvedValue({ deriveShieldedAddress } as any);
    const { accountBridge } = createBridges(makeSignerContext(jest.fn()), testContext);

    const result = await accountBridge.deriveShieldedAddress!("uview1testufvk");

    expect(deriveShieldedAddress).toHaveBeenCalledWith("uview1testufvk");
    expect(result).toBe("u1derived");
  });

  it("getShieldedAddress delegates to the signer with the account's freshAddressPath by default", async () => {
    const getShieldedAddress = jest.fn().mockResolvedValue({ address: "u1testunified" });
    const signerContext: SignerContext = jest.fn(async (_deviceId, fn) =>
      fn({ getShieldedAddress }),
    ) as unknown as SignerContext;
    const { accountBridge } = createBridges(signerContext, testContext);

    const result = await accountBridge.getShieldedAddress(account, { deviceId: "device-1" });

    expect(result).toEqual({ address: "u1testunified" });
    expect(getShieldedAddress).toHaveBeenCalledWith("44'/133'/0'/0/4", undefined);
  });

  it("getShieldedAddress passes display=true when requested", async () => {
    const getShieldedAddress = jest.fn().mockResolvedValue({ address: "u1testunified" });
    const signerContext: SignerContext = jest.fn(async (_deviceId, fn) =>
      fn({ getShieldedAddress }),
    ) as unknown as SignerContext;
    const { accountBridge } = createBridges(signerContext, testContext);

    await accountBridge.getShieldedAddress(account, { deviceId: "device-1", display: true });

    expect(getShieldedAddress).toHaveBeenCalledWith("44'/133'/0'/0/4", true);
  });
});

describe("signOperation routing", () => {
  const sign = (
    flag: { on: boolean },
    deviceModelId: DeviceModelId | undefined,
    transferType = "transparent",
  ) => {
    const { accountBridge } = createBridges(makeSignerContext(jest.fn()), testContext, {
      isShieldedEnabled: () => flag.on,
    });
    return firstValueFrom(
      accountBridge.signOperation({
        account,
        deviceId: "d",
        deviceModelId,
        transaction: { transferType },
      } as never),
    );
  };

  beforeEach(() => {
    shieldedSign.mockClear();
    legacySign.mockClear();
    nanoSSign.mockClear();
  });

  it("builds each signer once from the bridge context", () => {
    createBridges(makeSignerContext(jest.fn()), testContext);

    expect(buildSignOperation).toHaveBeenCalled();
    expect(buildLegacySignOperation).toHaveBeenCalled();
    expect(buildPreparedLegacySignOperation).toHaveBeenCalled();
  });

  it.each([DeviceModelId.nanoS, DeviceModelId.nanoX, undefined])(
    "uses the legacy signer for %s when the shielded engine is off",
    async model => {
      expect(await sign({ on: false }, model)).toEqual({ type: "legacy" });
    },
  );

  it.each([DeviceModelId.nanoSP, DeviceModelId.nanoX, DeviceModelId.stax, undefined])(
    "uses the shielded signer for %s when the engine is on",
    async model => {
      expect(await sign({ on: true }, model, "shielded")).toEqual({ type: "shielded" });
    },
  );

  it("signs a Nano S transparent send through the prepared legacy path", async () => {
    expect(await sign({ on: true }, DeviceModelId.nanoS)).toEqual({ type: "nanoS" });
    expect(shieldedSign).not.toHaveBeenCalled();
  });

  it.each(["transparent-to-shielded", "shielded-to-transparent", "shielded"])(
    "refuses a Nano S %s send with a dedicated error",
    async transferType => {
      await expect(sign({ on: true }, DeviceModelId.nanoS, transferType)).rejects.toBeInstanceOf(
        ZcashShieldedNotSupportedOnDevice,
      );
      expect(shieldedSign).not.toHaveBeenCalled();
      expect(legacySign).not.toHaveBeenCalled();
      expect(nanoSSign).not.toHaveBeenCalled();
    },
  );

  it("reads the flag on every call", async () => {
    const flag = { on: false };
    const { accountBridge } = createBridges(makeSignerContext(jest.fn()), testContext, {
      isShieldedEnabled: () => flag.on,
    });
    const run = () =>
      firstValueFrom(
        accountBridge.signOperation({
          account,
          deviceId: "d",
          deviceModelId: DeviceModelId.nanoX,
          transaction: { transferType: "shielded" },
        } as never),
      );

    expect(await run()).toEqual({ type: "legacy" });
    flag.on = true;
    expect(await run()).toEqual({ type: "shielded" });
  });
});

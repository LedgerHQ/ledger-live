import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { mockAccountReceive } from "@domain/entity-account-receive/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import { ACCOUNT, SELECTION, TOKEN, fakePorts } from "../__tests__/verifyAddressPorts";
import { prepareVerifyAddress } from "./prepareVerifyAddress";

const USDT = CryptoOrTokenCurrencyIdSchema.parse(
  "ethereum/erc20/usd_tether__erc20__0xdac17f958d2ee523a2206206994597c13d831ec7",
);
const listeners = { onResult: jest.fn(), onAttemptStart: jest.fn() };
const ALL_MODELS = Object.values(DeviceModelId);

describe("prepareVerifyAddress", () => {
  it("should prepare the device verification of a native coin, tracked as that coin", async () => {
    const ports = fakePorts();

    const preparation = await prepareVerifyAddress(ACCOUNT, SELECTION, undefined, listeners, ports);

    expect(preparation).toEqual({
      type: "ready",
      prepared: expect.objectContaining({
        deviceInitializationInput: { appName: "Ethereum" },
        tracking: { asset: "ETH", network: "ethereum" },
      }),
    });
    expect(ports.findToken).not.toHaveBeenCalled();
  });

  it("should track a token by its ticker when receiving a token", async () => {
    const ports = fakePorts();

    const preparation = await prepareVerifyAddress(
      ACCOUNT,
      { ...SELECTION, assetId: USDT },
      undefined,
      listeners,
      ports,
    );

    expect(preparation.type === "ready" && preparation.prepared.tracking).toEqual({
      asset: TOKEN.ticker,
      network: "ethereum",
    });
    expect(ports.buildInitializationInput).toHaveBeenCalledWith({
      account: ACCOUNT,
      tokenCurrency: TOKEN,
    });
  });

  it("should fail when the token is unknown", async () => {
    const ports = fakePorts({ findToken: jest.fn(async () => undefined) });

    await expect(
      prepareVerifyAddress(ACCOUNT, { ...SELECTION, assetId: USDT }, undefined, listeners, ports),
    ).resolves.toEqual({ type: "exit", outcome: "failed" });
  });

  it("should be unsupported when no device model can verify the family", async () => {
    await expect(
      prepareVerifyAddress(ACCOUNT, SELECTION, ALL_MODELS, listeners, fakePorts()),
    ).resolves.toEqual({
      type: "exit",
      outcome: "unsupported",
      tracking: { asset: "ETH", network: "ethereum" },
    });
  });

  it("should be unsupported when the device cannot show the verification", async () => {
    const { verification } = mockAccountReceive({
      verification: { type: "publicKey", path: "m/44h/60h/0h/0/0", publicKey: "02ab" },
    });

    await expect(
      prepareVerifyAddress(
        ACCOUNT,
        { ...SELECTION, verification: verification! },
        undefined,
        listeners,
        fakePorts(),
      ),
    ).resolves.toEqual(expect.objectContaining({ type: "exit", outcome: "unsupported" }));
  });
});

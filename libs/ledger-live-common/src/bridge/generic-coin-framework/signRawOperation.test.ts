import { getCoinModuleApi } from "./api";
import { buildContext } from "./api/context";
import { getBridgeApi } from "./bridge";
import { isPortfolioEnabledFor } from "./portfolio/config";
import { openNetworkPortfolio } from "./portfolio/network";
import { genericSignRawOperation } from "./signRawOperation";
import { buildOptimisticOperation } from "./utils";
import { lastValueFrom, Observable, toArray } from "rxjs";

jest.mock("./api", () => ({ getCoinModuleApi: jest.fn() }));
jest.mock("./api/context", () => ({ buildContext: jest.fn(() => ({})) }));
jest.mock("./bridge", () => ({ getBridgeApi: jest.fn() }));
jest.mock("./utils", () => ({ buildOptimisticOperation: jest.fn(() => ({ id: "op" })) }));
jest.mock("./portfolio/config", () => ({ isPortfolioEnabledFor: jest.fn(() => false) }));
jest.mock("./portfolio/network", () => ({ openNetworkPortfolio: jest.fn() }));

describe("genericSignRawOperation", () => {
  it("resolves the coin-module api and context by account.currency.id, not the family/network param", async () => {
    const coinModuleApi = {
      getNextSequence: jest.fn().mockResolvedValue(0n),
      craftRawTransaction: jest.fn().mockResolvedValue({ transaction: "unsigned" }),
      combine: jest.fn().mockResolvedValue("combined"),
    };
    (getCoinModuleApi as jest.Mock).mockResolvedValue(coinModuleApi);
    (getBridgeApi as jest.Mock).mockResolvedValue({ getDeviceSignOptions: undefined });

    const signerContext = jest.fn((_deviceId: unknown, fn: (signer: unknown) => unknown) =>
      fn({
        getAddress: jest.fn().mockResolvedValue({ publicKey: "pk" }),
        signTransaction: jest.fn().mockResolvedValue("sig"),
      }),
    );

    const signRaw = genericSignRawOperation("evm", "local")(signerContext as any);

    await new Promise<void>((resolve, reject) => {
      signRaw({
        account: {
          currency: { id: "ethereum", family: "evm" },
          freshAddress: "0xAddr",
          freshAddressPath: "44'/60'/0'/0/0",
        },
        transaction: "0a01",
        deviceId: "device",
      } as any).subscribe({ error: reject, complete: () => resolve() });
    });

    expect(getCoinModuleApi).toHaveBeenCalledWith("ethereum", "local");
    expect(buildContext).toHaveBeenCalledWith("ethereum");
    expect(coinModuleApi.craftRawTransaction).toHaveBeenCalled();
  });

  it("hands the family's raw signing the whole request, broadcast flag included", async () => {
    const familySignRaw = jest.fn(() => new Observable(o => o.complete()));
    (getBridgeApi as jest.Mock).mockResolvedValue({ signRawOperation: familySignRaw });
    const arg = {
      account: { currency: { id: "bitcoin", family: "bitcoin" } },
      transaction: "cHNidP8=",
      deviceId: "device",
      broadcast: true,
    } as any;

    await new Promise<void>((resolve, reject) => {
      genericSignRawOperation(
        "bitcoin",
        "local",
      )(jest.fn() as any)(arg).subscribe({
        error: reject,
        complete: () => resolve(),
      });
    });

    expect(familySignRaw).toHaveBeenCalledWith(arg);
  });

  it("signs through the portfolio layer when the coin config of the currency enables it", async () => {
    jest.mocked(isPortfolioEnabledFor).mockReturnValue(true);
    const coinModuleApi = {
      getNextSequence: jest.fn(),
      craftRawTransaction: jest.fn(),
      combine: jest.fn(),
    };
    const portfolio = {
      getNextSequence: jest.fn(async () => ({ value: "5" })),
      encodeRawTransaction: jest.fn(async () => ({ rawTransaction: "portfolio-unsigned" })),
      combineTransaction: jest.fn(async () => ({ signedTransaction: "portfolio-signed" })),
    };
    const bridgeApi = { getDeviceSignOptions: undefined };
    (getCoinModuleApi as jest.Mock).mockResolvedValue(coinModuleApi);
    (getBridgeApi as jest.Mock).mockResolvedValue(bridgeApi);
    jest
      .mocked(openNetworkPortfolio)
      .mockResolvedValue({ portfolio, network: "ethereum", mode: "local" } as never);
    const signTransaction = jest.fn().mockResolvedValue("sig");
    const signerContext = jest.fn((_deviceId: unknown, fn: (signer: unknown) => unknown) =>
      fn({ getAddress: jest.fn().mockResolvedValue({ publicKey: "pk" }), signTransaction }),
    );
    const account = {
      currency: { id: "ethereum", family: "evm" },
      freshAddress: "0xAddr",
      freshAddressPath: "44'/60'/0'/0/0",
    };

    const events = await lastValueFrom(
      genericSignRawOperation(
        "evm",
        "local",
      )(signerContext as any)({ account, transaction: "0a01", deviceId: "device" } as any).pipe(
        toArray(),
      ),
    );

    expect(portfolio.encodeRawTransaction).toHaveBeenCalledWith("ethereum", {
      transaction: "0a01",
      sender: "0xAddr",
      senderPublicKey: "pk",
      sequence: "5",
    });
    expect(signTransaction).toHaveBeenCalledWith("44'/60'/0'/0/0", "portfolio-unsigned", undefined);
    expect(portfolio.combineTransaction).toHaveBeenCalledWith("ethereum", {
      rawTransaction: "portfolio-unsigned",
      signature: "sig",
      pubkey: "pk",
    });
    expect(buildOptimisticOperation).toHaveBeenLastCalledWith(account, expect.anything(), 5n);
    expect(events[events.length - 1]).toEqual({
      type: "signed",
      signedOperation: { operation: { id: "op" }, signature: "portfolio-signed" },
    });
    expect(coinModuleApi.getNextSequence).not.toHaveBeenCalled();
    expect(coinModuleApi.craftRawTransaction).not.toHaveBeenCalled();
    expect(coinModuleApi.combine).not.toHaveBeenCalled();
  });

  describe("on the legacy path", () => {
    const account = {
      currency: { id: "ripple", family: "xrp" },
      freshAddress: "rAddr",
      freshAddressPath: "44'/144'/0'/0/0",
    };
    const coinModuleApi = {
      getNextSequence: jest.fn().mockResolvedValue(3n),
      craftRawTransaction: jest.fn().mockResolvedValue({ transaction: "unsigned" }),
      combine: jest.fn().mockResolvedValue("combined"),
    };
    const run = (signerContext: unknown) =>
      lastValueFrom(
        genericSignRawOperation(
          "xrp",
          "local",
        )(signerContext as any)({ account, transaction: "0a01", deviceId: "d" } as any).pipe(
          toArray(),
        ),
      );

    beforeEach(() => {
      jest.mocked(isPortfolioEnabledFor).mockReturnValue(false);
      (getCoinModuleApi as jest.Mock).mockResolvedValue(coinModuleApi);
      (getBridgeApi as jest.Mock).mockResolvedValue({});
    });

    it("emits nothing more once the user cancels on the device", async () => {
      await expect(run(jest.fn(async () => undefined))).resolves.toEqual([]);
      expect(coinModuleApi.combine).not.toHaveBeenCalled();
    });

    it("still emits the signed operation when its optimistic operation has no id", async () => {
      jest.mocked(buildOptimisticOperation).mockReturnValueOnce({} as never);
      const events = await run(
        jest.fn(async (_deviceId: unknown, fn: (signer: unknown) => unknown) =>
          fn({
            getAddress: jest.fn().mockResolvedValue({ publicKey: "pk" }),
            signTransaction: jest.fn().mockResolvedValue("sig"),
          }),
        ),
      );
      expect(events.map(({ type }) => type)).toEqual([
        "device-signature-requested",
        "device-signature-granted",
        "signed",
      ]);
    });

    it("fails the signing with the error of a step", async () => {
      const failure = new Error("device locked");
      await expect(run(jest.fn(async () => Promise.reject(failure)))).rejects.toBe(failure);
    });
  });
});

import { getCoinModuleApi } from "./api";
import { buildContext } from "./api/context";
import { getBridgeApi } from "./bridge";
import { genericSignRawOperation } from "./signRawOperation";

jest.mock("./api", () => ({ getCoinModuleApi: jest.fn() }));
jest.mock("./api/context", () => ({ buildContext: jest.fn(() => ({})) }));
jest.mock("./bridge", () => ({ getBridgeApi: jest.fn() }));
jest.mock("./utils", () => ({ buildOptimisticOperation: jest.fn(() => ({ id: "op" })) }));

describe("genericSignRawOperation", () => {
  it("resolves the coin-module api and context by network, not the token currency id", async () => {
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

    const signRaw = genericSignRawOperation("tron", "local")(signerContext as any);

    await new Promise<void>((resolve, reject) => {
      signRaw({
        // A TRC-20 TokenAccount: currency.id is the token id, distinct from the "tron" network.
        account: {
          currency: { id: "tron/trc20/usdt", family: "tron" },
          freshAddress: "TAddr",
          freshAddressPath: "44'/195'/0'/0/0",
        },
        transaction: "0a01",
        deviceId: "device",
      } as any).subscribe({ error: reject, complete: () => resolve() });
    });

    // Must resolve the parent coin-module (which carries craftRawTransaction), not the token id
    // which would miss it and fall through to the unsupported network coin-service API.
    expect(getCoinModuleApi).toHaveBeenCalledWith("tron", "local");
    expect(buildContext).toHaveBeenCalledWith("tron");
    expect(coinModuleApi.craftRawTransaction).toHaveBeenCalled();
  });
});

import { getCoinModuleApi } from "./api";
import { buildContext } from "./api/context";
import { getBridgeApi } from "./bridge";
import { genericSignRawOperation } from "./signRawOperation";

jest.mock("./api", () => ({ getCoinModuleApi: jest.fn() }));
jest.mock("./api/context", () => ({ buildContext: jest.fn(() => ({})) }));
jest.mock("./bridge", () => ({ getBridgeApi: jest.fn() }));
jest.mock("./utils", () => ({ buildOptimisticOperation: jest.fn(() => ({ id: "op" })) }));

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

    // The bridge is built per family, so the network/family param is "evm" — NOT a currency id.
    const signRaw = genericSignRawOperation("evm", "local")(signerContext as any);

    await new Promise<void>((resolve, reject) => {
      signRaw({
        // A base account: currency.id is the chain currency id ("ethereum"), distinct from family "evm".
        account: {
          currency: { id: "ethereum", family: "evm" },
          freshAddress: "0xAddr",
          freshAddressPath: "44'/60'/0'/0/0",
        },
        transaction: "0a01",
        deviceId: "device",
      } as any).subscribe({ error: reject, complete: () => resolve() });
    });

    // Must resolve by the currency id ("ethereum"); resolving by the family ("evm") finds no currency
    // configuration and raw signing falls through to the unsupported network coin-service API.
    expect(getCoinModuleApi).toHaveBeenCalledWith("ethereum", "local");
    expect(buildContext).toHaveBeenCalledWith("ethereum");
    expect(coinModuleApi.craftRawTransaction).toHaveBeenCalled();
  });
});

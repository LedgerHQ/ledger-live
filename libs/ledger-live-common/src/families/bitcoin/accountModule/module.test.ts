import type { UtxoCoinModuleApi } from "@ledgerhq/account-module-utxo";
import type { createApi } from "@ledgerhq/coin-bitcoin/api";
import { getCoinModuleApi } from "../../../bridge/generic-coin-framework/api";
import { getBitcoinCoinConfig } from "../coinConfig";
import { bitcoinAccountModule, bitcoinAccountModuleOf } from "./module";

jest.mock("../coinConfig", () => ({ getBitcoinCoinConfig: jest.fn() }));
jest.mock("../../../bridge/generic-coin-framework/api", () => ({ getCoinModuleApi: jest.fn() }));

/** coin-bitcoin implements the UTXO primitives of the account layer: checked where both meet. */
const implementsUtxoPrimitives = (api: ReturnType<typeof createApi>): UtxoCoinModuleApi => api;

describe("bitcoinAccountModule", () => {
  it("drops replaced operations after the expiry the coin config sets", async () => {
    (getBitcoinCoinConfig as jest.Mock).mockReturnValue({ sync: { replacedOperationExpiryMs: 1 } });
    const api = {
      lastBlock: jest.fn(async () => ({ height: 1, hash: "h1", time: new Date() })),
      getBlockInfo: jest.fn(),
      deriveAddress: jest.fn(
        async (_c: unknown, { chain, index }: { chain: number; index: number }) =>
          `a-${chain}-${index}`,
      ),
      listAddressTransactions: jest.fn(async () => ({ items: [] })),
    };
    const module = bitcoinAccountModule(api as never, "litecoin");
    const history = {
      list: jest.fn(async () => ({ items: [] })),
      upsert: jest.fn(),
      remove: jest.fn(),
    };
    for await (const _ of module.sync({} as never, {
      descriptor: {
        key: "x",
        derivationMode: "",
        derivationPath: "44'/2'/0'",
        currencyId: "litecoin",
        index: 0,
      },
      state: undefined,
      history,
    })) {
      // drained
    }
    expect(getBitcoinCoinConfig).toHaveBeenCalledWith("litecoin");
  });

  it("serves a currency on its local coin module, which implements the UTXO primitives", async () => {
    (getCoinModuleApi as jest.Mock).mockResolvedValue({});
    const module = await bitcoinAccountModuleOf("bitcoin");
    expect(getCoinModuleApi).toHaveBeenCalledWith("bitcoin", "local");
    expect(module.getChangeAddress).toEqual(expect.any(Function));
    expect(implementsUtxoPrimitives).toEqual(expect.any(Function));
  });
});

import type Transport from "@ledgerhq/hw-transport";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import getAddress from "./index";
import { loadSetupForFamily } from "../../coin-modules/registry";

jest.mock("../../coin-modules/registry", () => ({
  isCoinModuleRegistered: () => true,
  loadSetupForFamily: jest.fn(),
}));

const mockedLoadSetupForFamily = jest.mocked(loadSetupForFamily);

describe("getAddress", () => {
  const transport = {} as Transport;
  const resolver = jest.fn(async () => ({ address: "addr", publicKey: "pk", path: "path" }));

  beforeEach(() => {
    jest.clearAllMocks();
    mockedLoadSetupForFamily.mockResolvedValue({ resolver } as never);
  });

  // Zcash keeps `family: "bitcoin"`, but its addresses come from coin-zcash's signer.
  it.each(["zcash", "zcash_testnet"])("uses the zcash module for a %s address", async id => {
    await getAddress(transport, {
      currency: getCryptoCurrencyById(id),
      path: "44'/133'/0'/0/0",
      derivationMode: "",
    });

    expect(mockedLoadSetupForFamily).toHaveBeenCalledWith("zcash");
    expect(resolver).toHaveBeenCalledTimes(1);
  });

  it("uses the bitcoin module for a bitcoin address", async () => {
    await getAddress(transport, {
      currency: getCryptoCurrencyById("bitcoin"),
      path: "84'/0'/0'/0/0",
      derivationMode: "native_segwit",
    });

    expect(mockedLoadSetupForFamily).toHaveBeenCalledWith("bitcoin");
  });
});

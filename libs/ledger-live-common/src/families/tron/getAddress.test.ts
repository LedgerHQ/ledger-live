import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { TronSigner } from "@ledgerhq/coin-tron/types/index";
import type { GetAddressOptions } from "@ledgerhq/ledger-wallet-framework/derivation";
import resolver from "./getAddress";

const getAddress = jest.fn().mockResolvedValue({ address: "TAddr", publicKey: "pub" });
const signerContext = <T>(_deviceId: string, fn: (signer: TronSigner) => Promise<T>): Promise<T> =>
  fn({ getAddress, sign: jest.fn() });

const options = (verify: boolean): GetAddressOptions => ({
  currency: getCryptoCurrencyById("tron"),
  path: "44'/195'/0'/0/0",
  derivationMode: "",
  verify,
});

describe("tron getAddress resolver", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("adds the requested path to what the device returned", async () => {
    const resolved = await resolver(signerContext)("deviceId", options(false));

    // The device answers with `{ address, publicKey }` only; the framework's `Result` needs `path`.
    expect(resolved).toEqual({ address: "TAddr", publicKey: "pub", path: "44'/195'/0'/0/0" });
  });

  it("forwards verify to the device, so an on-device confirmation is only asked for when requested", async () => {
    await resolver(signerContext)("deviceId", options(true));

    expect(getAddress).toHaveBeenCalledWith("44'/195'/0'/0/0", true);
  });
});

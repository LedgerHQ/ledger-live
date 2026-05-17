import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { PolkadotSigner } from "../types";
import getAddress from "./getAddress";

const makeSignerContext =
  (mockSigner: PolkadotSigner) =>
  <T>(_deviceId: string, fn: (signer: PolkadotSigner) => Promise<T>): Promise<T> =>
    fn(mockSigner);

const makeCurrency = (id: string): CryptoCurrency =>
  ({
    id,
    type: "CryptoCurrency",
    name: id,
    managerAppName: id,
    ticker: id.toUpperCase(),
    scheme: id,
    color: "#000000",
    family: "polkadot",
    coinType: 434,
    units: [{ name: id, code: id.toUpperCase(), magnitude: 9 }],
    explorerViews: [],
  }) as unknown as CryptoCurrency;

describe("getAddress ss58prefix routing", () => {
  const fakeSigner: PolkadotSigner = {
    getAddress: jest.fn().mockResolvedValue({
      address: "fake_address",
      pubKey: "fake_pubkey",
      return_code: 0,
    }),
    sign: jest.fn(),
  };

  const signerContext = makeSignerContext(fakeSigner);
  const getAddressFn = getAddress(signerContext);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes ss58prefix=0 for polkadot", async () => {
    await getAddressFn("deviceId", {
      currency: makeCurrency("polkadot"),
      path: "44'/434'/0'/0/0",
      derivationMode: "",
    });
    expect(fakeSigner.getAddress).toHaveBeenCalledWith("44'/434'/0'/0/0", 0, undefined);
  });

  it("passes ss58prefix=0 for assethub_polkadot", async () => {
    await getAddressFn("deviceId", {
      currency: makeCurrency("assethub_polkadot"),
      path: "44'/434'/0'/0/0",
      derivationMode: "",
    });
    expect(fakeSigner.getAddress).toHaveBeenCalledWith("44'/434'/0'/0/0", 0, undefined);
  });

  it("passes ss58prefix=42 for westend", async () => {
    await getAddressFn("deviceId", {
      currency: makeCurrency("westend"),
      path: "44'/434'/0'/0/0",
      derivationMode: "",
    });
    expect(fakeSigner.getAddress).toHaveBeenCalledWith("44'/434'/0'/0/0", 42, undefined);
  });

  it("passes ss58prefix=42 for assethub_westend", async () => {
    await getAddressFn("deviceId", {
      currency: makeCurrency("assethub_westend"),
      path: "44'/434'/0'/0/0",
      derivationMode: "",
    });
    expect(fakeSigner.getAddress).toHaveBeenCalledWith("44'/434'/0'/0/0", 42, undefined);
  });

  it("passes ss58prefix=42 for bittensor", async () => {
    await getAddressFn("deviceId", {
      currency: makeCurrency("bittensor"),
      path: "44'/434'/0'/0/0",
      derivationMode: "",
    });
    expect(fakeSigner.getAddress).toHaveBeenCalledWith("44'/434'/0'/0/0", 42, undefined);
  });

  it("defaults to ss58prefix=0 for an unknown currency", async () => {
    await getAddressFn("deviceId", {
      currency: makeCurrency("unknown_chain"),
      path: "44'/434'/0'/0/0",
      derivationMode: "",
    });
    expect(fakeSigner.getAddress).toHaveBeenCalledWith("44'/434'/0'/0/0", 0, undefined);
  });

  it("returns address, publicKey and path from signer response", async () => {
    const result = await getAddressFn("deviceId", {
      currency: makeCurrency("polkadot"),
      path: "44'/434'/0'/0/0",
      derivationMode: "",
    });
    expect(result).toEqual({
      address: "fake_address",
      publicKey: "fake_pubkey",
      path: "44'/434'/0'/0/0",
    });
  });
});

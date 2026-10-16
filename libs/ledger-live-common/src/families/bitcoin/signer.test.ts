import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";

const btcInstances: Array<Record<string, jest.Mock> & { currency: string }> = [];
jest.mock("@ledgerhq/hw-app-btc", () =>
  jest.fn().mockImplementation(({ currency }) => {
    const instance = {
      currency,
      getWalletPublicKey: jest.fn(async () => ({
        bitcoinAddress: "addr",
        publicKey: "pub",
        chainCode: "cc",
      })),
      splitTransaction: jest.fn((hex: string) => ({ split: hex })),
      createPaymentTransaction: jest.fn(async () => "signed-hex"),
      getWalletXpub: jest.fn(async () => "xpub"),
      signPsbtBuffer: jest.fn(async () => ({ psbt: Buffer.from("p") })),
      signMessage: jest.fn(async () => ({ v: 0, r: "r", s: "s" })),
    };
    btcInstances.push(instance as never);
    return instance;
  }),
);
jest.mock("../../bridge/setup", () => ({
  executeWithSigner: jest.fn(
    factory => async (_deviceId: string, fn: (s: unknown) => unknown) => fn(factory("transport")),
  ),
}));

import signerModule, { createSigner, resolver } from "./signer";

const envelope = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify({
    version: 1,
    currency: "bitcoin",
    inputs: [
      {
        prevTxHex: "prev",
        txid: "t",
        outputIndex: 1,
        sequence: 0,
        path: "84'/0'/0'/0/3",
        blockHeight: 9,
      },
    ],
    outputs: [],
    outputScriptHex: "outputs",
    sigHashType: 1,
    segwit: true,
    additionals: ["bitcoin", "bech32"],
    hasExtraData: false,
    blockHeight: 100,
    ...overrides,
  });

beforeEach(() => {
  btcInstances.length = 0;
});

describe("createSigner", () => {
  const signer = () => createSigner("transport" as never);

  it("opens one app per currency", async () => {
    const s = signer();
    await s.getAddress("p", { currencyId: "bitcoin" });
    await s.getAddress("p", { currencyId: "bitcoin" });
    await s.getAddress("p", { currencyId: "litecoin" });
    expect(btcInstances.map(b => b.currency)).toEqual(["bitcoin", "litecoin"]);
  });

  it("reads an address in the format of the derivation mode", async () => {
    const s = signer();
    expect(
      await s.getAddress("84'/0'/0'/0/0", {
        currencyId: "bitcoin",
        derivationMode: "native_segwit",
        verify: true,
      }),
    ).toEqual({
      address: "addr",
      publicKey: "pub",
      chainCode: "cc",
      path: "84'/0'/0'/0/0",
    });
    expect(btcInstances[0].getWalletPublicKey).toHaveBeenCalledWith("84'/0'/0'/0/0", {
      verify: true,
      format: "bech32",
    });
    await s.getAddress("44'/0'/0'/0/0", { currencyId: "bitcoin" });
    expect(btcInstances[0].getWalletPublicKey).toHaveBeenLastCalledWith("44'/0'/0'/0/0", {
      verify: false,
      format: "legacy",
    });
  });

  it("reads Bitcoin Cash addresses as cashaddr, unless forced otherwise", async () => {
    const s = signer();
    await s.getAddress("p", { currencyId: "bitcoin_cash" });
    expect(btcInstances[0].getWalletPublicKey).toHaveBeenLastCalledWith("p", {
      verify: false,
      format: "cashaddr",
    });
    await s.getAddress("p", { currencyId: "bitcoin_cash", forceFormat: "legacy" });
    expect(btcInstances[0].getWalletPublicKey).toHaveBeenLastCalledWith("p", {
      verify: false,
      format: "legacy",
    });
  });

  it("omits a missing chain code", async () => {
    const s = signer();
    await s.getAddress("p", { currencyId: "bitcoin" });
    btcInstances[0].getWalletPublicKey.mockResolvedValueOnce({
      bitcoinAddress: "a",
      publicKey: "k",
    });
    expect(await s.getAddress("p", { currencyId: "bitcoin" })).toEqual({
      address: "a",
      publicKey: "k",
      path: "p",
    });
  });

  it.each(["invalid format", "Unsupported address format"])(
    "reports %j as an unsupported derivation",
    async message => {
      const s = signer();
      await s.getAddress("p", { currencyId: "bitcoin" });
      btcInstances[0].getWalletPublicKey.mockRejectedValueOnce(new Error(message));
      await expect(s.getAddress("p", { currencyId: "bitcoin" })).rejects.toThrow(
        "UnsupportedDerivation",
      );
    },
  );

  it("lets other device errors through", async () => {
    const s = signer();
    await s.getAddress("p", { currencyId: "bitcoin" });
    btcInstances[0].getWalletPublicKey.mockRejectedValueOnce({ statusCode: 0x6985 });
    await expect(s.getAddress("p", { currencyId: "bitcoin" })).rejects.toEqual({
      statusCode: 0x6985,
    });
  });

  it("signs the envelope with createPaymentTransaction", async () => {
    const events = {
      onDeviceStreaming: jest.fn(),
      onDeviceSignatureRequested: jest.fn(),
      onDeviceSignatureGranted: jest.fn(),
    };
    const signed = await signer().signTransaction(
      "ignored",
      envelope({ lockTime: 5, expiryHeight: "00000000", changePath: "84'/0'/0'/1/2" }),
      events,
    );
    expect(signed).toBe("signed-hex");
    const btc = btcInstances[0];
    expect(btc.splitTransaction).toHaveBeenCalledWith("prev", true, false, ["bitcoin", "bech32"]);
    expect(btc.createPaymentTransaction).toHaveBeenCalledWith({
      inputs: [[{ split: "prev" }, 1, null, 0, 9]],
      associatedKeysets: ["84'/0'/0'/0/3"],
      outputScriptHex: "outputs",
      blockHeight: 100,
      lockTime: 5,
      sigHashType: 1,
      segwit: true,
      expiryHeight: Buffer.from("00000000", "hex"),
      changePath: "84'/0'/0'/1/2",
      additionals: ["bitcoin", "bech32"],
      ...events,
    });
  });

  it("leaves out what the envelope does not set", async () => {
    await signer().signTransaction("ignored", envelope({ sigHashType: 0, segwit: false }));
    expect(btcInstances[0].createPaymentTransaction).toHaveBeenCalledWith({
      inputs: [[{ split: "prev" }, 1, null, 0, 9]],
      associatedKeysets: ["84'/0'/0'/0/3"],
      outputScriptHex: "outputs",
      blockHeight: 100,
      additionals: ["bitcoin", "bech32"],
      onDeviceStreaming: undefined,
      onDeviceSignatureRequested: undefined,
      onDeviceSignatureGranted: undefined,
    });
  });

  it("refuses an envelope of another version", async () => {
    await expect(signer().signTransaction("p", envelope({ version: 2 }))).rejects.toThrow(
      "Unsupported bitcoin signing envelope version 2",
    );
    await expect(signer().signTransaction("p", "null")).rejects.toThrow("version undefined");
  });

  it("reads the xpub, signs PSBTs and messages with the currency's app", async () => {
    const s = signer();
    expect(
      await s.getWalletXpub({ currencyId: "litecoin", path: "84'/2'/0'", xpubVersion: 7 }),
    ).toBe("xpub");
    expect(btcInstances[0].getWalletXpub).toHaveBeenCalledWith({
      path: "84'/2'/0'",
      xpubVersion: 7,
    });
    expect(await s.signPsbtBuffer("litecoin", Buffer.from("x"), {} as never)).toEqual({
      psbt: Buffer.from("p"),
    });
    expect(await s.signMessage("litecoin", "44'/2'/0'/0/0", "abcd")).toEqual({
      v: 0,
      r: "r",
      s: "s",
    });
    expect(btcInstances).toHaveLength(1);
  });

  it("needs an app version that signs PSBTs", async () => {
    const s = signer();
    await s.getAddress("p", { currencyId: "dogecoin" });
    delete (btcInstances[0] as Record<string, unknown>).signPsbtBuffer;
    await expect(s.signPsbtBuffer("dogecoin", Buffer.from("x"), {} as never)).rejects.toThrow(
      "signPsbtBuffer not available",
    );
  });
});

describe("resolver", () => {
  it("resolves an address on the device of the given id", async () => {
    const context = jest.fn(async (_deviceId: string, fn: (s: unknown) => unknown) =>
      fn(createSigner("t" as never)),
    );
    const result = await resolver(context as never)("device", {
      currency: getCryptoCurrencyById("bitcoin"),
      path: "84'/0'/0'/0/0",
      derivationMode: "native_segwit",
      verify: true,
      forceFormat: "bech32",
    });
    expect(result.address).toBe("addr");
    expect(context.mock.calls[0][0]).toBe("device");
    expect(btcInstances[0].getWalletPublicKey).toHaveBeenCalledWith("84'/0'/0'/0/0", {
      verify: true,
      format: "bech32",
    });
  });

  it("does not verify unless asked", async () => {
    await signerModule.getAddress("device", {
      currency: getCryptoCurrencyById("bitcoin"),
      path: "44'/0'/0'/0/0",
      derivationMode: "",
    });
    expect(btcInstances[0].getWalletPublicKey).toHaveBeenCalledWith("44'/0'/0'/0/0", {
      verify: false,
      format: "legacy",
    });
  });
});

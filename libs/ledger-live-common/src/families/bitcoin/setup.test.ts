const zcashSignMessage = jest.fn(async () => ({ signature: "zcash-sig" }));
const zcashResolver = jest.fn(async () => ({ address: "t1zcash" }));
jest.mock("./zcashLegacy/setup", () => ({
  createMessageSigner: () => zcashSignMessage,
  resolver: (...args: unknown[]) => (zcashResolver as jest.Mock)(...args),
}));
const deviceSigner = {
  signMessage: jest.fn(async () => ({ v: 1, r: "aa", s: "bb" })),
  getAddress: jest.fn(async () => ({ address: "bc1q", publicKey: "k", path: "p" })),
};
jest.mock("./signer", () => ({
  createSigner: jest.fn(() => deviceSigner),
  resolver: jest.requireActual("./signer").resolver,
}));
jest.mock("@ledgerhq/hw-app-btc", () => jest.fn());

import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { messageSigner, resolver, signMessage } from "./setup";

const bitcoin = getCryptoCurrencyById("bitcoin");
const zcash = getCryptoCurrencyById("zcash");
const account = (currency = bitcoin) => ({ currency, freshAddressPath: "84'/0'/0'/0/1" }) as never;

beforeEach(() => jest.clearAllMocks());

describe("signMessage", () => {
  const context = jest.fn(async (_deviceId: string, fn: (s: typeof deviceSigner) => unknown) =>
    fn(deviceSigner),
  );

  it("signs the hex of the message with the fresh address key", async () => {
    expect(await signMessage(context as never)("d", account(), { message: "hi" } as never)).toEqual(
      {
        rsv: { v: 1, r: "aa", s: "bb" },
        signature: `${(1 + 27 + 4).toString(16)}aabb`,
      },
    );
    expect(deviceSigner.signMessage).toHaveBeenCalledWith("bitcoin", "84'/0'/0'/0/1", "6869");
  });

  it("signs with the key of the path given", async () => {
    await signMessage(context as never)("d", account(), {
      message: "hi",
      path: "44'/0'/0'/0/0",
    } as never);
    expect(deviceSigner.signMessage).toHaveBeenCalledWith("bitcoin", "44'/0'/0'/0/0", "6869");
  });

  it("only signs text messages", async () => {
    await expect(
      signMessage(context as never)("d", account(), { message: { typed: true } } as never),
    ).rejects.toThrow("Invalid message type");
  });
});

describe("messageSigner", () => {
  it("signs on the given transport, Zcash through its legacy flow", async () => {
    expect(
      await messageSigner.signMessage("t" as never, account(), { message: "hi" } as never),
    ).toMatchObject({
      signature: `${(1 + 27 + 4).toString(16)}aabb`,
    });
    expect(
      await messageSigner.signMessage("t" as never, account(zcash), { message: "hi" } as never),
    ).toEqual({
      signature: "zcash-sig",
    });
    expect(zcashSignMessage).toHaveBeenCalledWith("t", account(zcash), { message: "hi" });
  });
});

describe("resolver", () => {
  it("resolves on the given transport, Zcash through its legacy flow", async () => {
    expect(
      await resolver("t" as never, {
        currency: bitcoin,
        path: "84'/0'/0'/0/0",
        derivationMode: "native_segwit",
      }),
    ).toMatchObject({ address: "bc1q" });
    expect(
      await resolver("t" as never, { currency: zcash, path: "p", derivationMode: "" }),
    ).toEqual({
      address: "t1zcash",
    });
    expect(zcashResolver).toHaveBeenCalledWith("t", {
      currency: zcash,
      path: "p",
      derivationMode: "",
    });
  });
});

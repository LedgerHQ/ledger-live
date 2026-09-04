import Hedera from "@ledgerhq/hw-app-hedera";
import Transport from "@ledgerhq/hw-transport";
import type { GetAddressOptions } from "@ledgerhq/ledger-wallet-framework/derivation";
import { getSigner } from "../../bridge/generic-coin-framework/signer";
import { coinModuleLoaders } from "../../coin-modules/loaders";
import hederaSigner, { createSigner, hederaGetAddress } from "./signer";

jest.mock("@ledgerhq/hw-app-hedera");

const MockedHedera = Hedera as jest.MockedClass<typeof Hedera>;
const mockTransport = {} as Transport;

describe("createSigner (Hedera)", () => {
  let getPublicKey: jest.Mock;
  let signTransaction: jest.Mock;

  beforeEach(() => {
    getPublicKey = jest.fn().mockResolvedValue("aabbcc");
    signTransaction = jest.fn();
    MockedHedera.mockImplementation(() => ({ getPublicKey, signTransaction }) as unknown as Hedera);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("wires the transport through to hw-app-hedera", () => {
    createSigner(mockTransport);

    expect(MockedHedera).toHaveBeenCalledTimes(1);
    expect(MockedHedera).toHaveBeenCalledWith(mockTransport);
  });

  it("getAddress resolves through the signer context", async () => {
    const signer = createSigner(mockTransport);
    const context = <U>(_deviceId: string, fn: (s: ReturnType<typeof createSigner>) => U) =>
      Promise.resolve(fn(signer));

    const result = await hederaGetAddress(context)("deviceId", {
      path: "44'/3030'/0'/0'/0'",
    } as GetAddressOptions);

    expect(getPublicKey).toHaveBeenCalledTimes(1);
    expect(getPublicKey).toHaveBeenCalledWith("44'/3030'/0'/0'/0'");
    expect(result).toEqual({
      path: "44'/3030'/0'/0'/0'",
      address: "aabbcc",
      publicKey: "aabbcc",
    });
  });
});

describe("hedera signer registration", () => {
  it("registers a loadSigner on the hedera coin-module loader", () => {
    const loader = coinModuleLoaders.find(l => l.family === "hedera");

    expect(loader?.loadSigner).toBeDefined();
  });

  it("resolves through getSigner so the generic coin framework can reach it", async () => {
    await expect(getSigner("hedera")).resolves.toBe(hederaSigner);
  });
});

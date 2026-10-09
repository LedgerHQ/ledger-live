import Hedera from "@ledgerhq/hw-app-hedera";
import Transport from "@ledgerhq/hw-transport";
import type { GetAddressOptions } from "@ledgerhq/ledger-wallet-framework/derivation";
import { DmkSignerHedera } from "@ledgerhq/live-signer-hedera";
import { getSigner } from "../../bridge/generic-coin-framework/signer";
import { coinModuleLoaders } from "../../coin-modules/loaders";
import { setHederaLdmkEnabled } from "./setup";
import hederaSigner, { createSigner, hederaGetAddress } from "./signer";

jest.mock("@ledgerhq/hw-app-hedera");
jest.mock("@ledgerhq/live-signer-hedera", () => ({
  ...jest.requireActual("@ledgerhq/live-signer-hedera"),
  DmkSignerHedera: jest.fn(),
}));

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

describe("createSigner (Hedera) over a DMK transport", () => {
  const dmkTransport = { dmk: {}, sessionId: "session-id" } as unknown as Transport;
  const MockedDmkSigner = DmkSignerHedera as jest.MockedClass<typeof DmkSignerHedera>;
  let getPublicKey: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    getPublicKey = jest.fn().mockResolvedValue("ddeeff");
    MockedDmkSigner.mockImplementation(() => ({ getPublicKey }) as unknown as DmkSignerHedera);
  });

  afterEach(() => setHederaLdmkEnabled(false));

  it("should read the public key through the DMK signer when the ldmkHederaSigner flag is on", async () => {
    setHederaLdmkEnabled(true);
    const signer = createSigner(dmkTransport);

    const result = await signer.getAddress("44/3030");

    expect(MockedDmkSigner).toHaveBeenCalledTimes(1);
    expect(MockedDmkSigner).toHaveBeenCalledWith({}, "session-id");
    expect(getPublicKey).toHaveBeenCalledTimes(1);
    expect(getPublicKey).toHaveBeenCalledWith("44/3030");
    expect(MockedHedera).not.toHaveBeenCalled();
    expect(result).toEqual({ path: "44/3030", address: "ddeeff", publicKey: "ddeeff" });
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

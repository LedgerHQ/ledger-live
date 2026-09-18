import { LkrpNotImplementedError } from "./errors";
import { LkrpSdk } from "./sdk";
import {
  createCommandStreamCodec,
  createSoftwareDeviceLayer,
  createTrustchainHttpBackend,
} from "./adapters";
import { createMockLkrpSdk } from "./mockSdk";

const key = { id: "member-key", publicKey: Uint8Array.from([1]) };
const credentials = { key };
const trustchain = { rootId: "root", applicationPath: "m/0'" };
const member = { id: "member", name: "Ledger Wallet", publicKey: key.publicKey };

describe(LkrpSdk.name, () => {
  it("can be composed without a device layer", async () => {
    const sdk = createMockLkrpSdk({ device: undefined });

    const generated = await sdk.createLocalKeyPair("member");

    expect(sdk.capabilities).toEqual({ device: false });
    await expect(sdk.loadLocalKeyPair("member")).resolves.toEqual(generated);
    await expect(sdk.readTrustchain("root")).resolves.toEqual({
      rootId: "root",
      nodes: [],
      streams: [],
    });
    await expect(sdk.encryptFor(key.publicKey, Uint8Array.from([2]))).resolves.toEqual(
      Uint8Array.from([2]),
    );
    await expect(sdk.decryptWith(key, Uint8Array.from([3]))).resolves.toEqual(Uint8Array.from([3]));
  });

  it("can be composed with an injected device layer", () => {
    expect(createMockLkrpSdk().capabilities).toEqual({ device: true });
  });

  it.each([
    [
      "getOrCreateTrustchain",
      (sdk: LkrpSdk) =>
        sdk.getOrCreateTrustchain({
          applicationId: 16,
          member,
          localCredentials: credentials,
        }),
    ],
    ["restoreTrustchain", (sdk: LkrpSdk) => sdk.restoreTrustchain(trustchain, credentials)],
    ["getMembers", (sdk: LkrpSdk) => sdk.getMembers(trustchain, credentials)],
    [
      "addMember",
      (sdk: LkrpSdk) => sdk.addMember({ trustchain, member, localCredentials: credentials }),
    ],
    [
      "removeMember",
      (sdk: LkrpSdk) => sdk.removeMember({ trustchain, member, localCredentials: credentials }),
    ],
    ["destroyTrustchain", (sdk: LkrpSdk) => sdk.destroyTrustchain(trustchain, credentials)],
    ["destroyApplication", (sdk: LkrpSdk) => sdk.destroyApplication(trustchain, credentials)],
  ])("exposes the unimplemented %s operation", async (_operation, run) => {
    await expect(run(createMockLkrpSdk())).rejects.toEqual(
      expect.objectContaining({ name: LkrpNotImplementedError.name }),
    );
  });
});

describe("LKRP adapter shells", () => {
  it("exposes an HTTP Trustchain backend that is not implemented", async () => {
    const backend = createTrustchainHttpBackend({
      baseUrl: "https://trustchain.example",
      fetch,
    });

    await expect(backend.list()).rejects.toEqual(
      expect.objectContaining({ name: LkrpNotImplementedError.name }),
    );
  });

  it("exposes a command stream codec that is not implemented", () => {
    expect(() => createCommandStreamCodec().encode({ path: "m/", blocks: [] })).toThrow(
      expect.objectContaining({ name: LkrpNotImplementedError.name }),
    );
  });

  it("exposes a software device layer that is not implemented", async () => {
    await expect(
      createSoftwareDeviceLayer().execute({ type: "close-stream", path: "m/0'" }),
    ).rejects.toEqual(expect.objectContaining({ name: LkrpNotImplementedError.name }));
  });
});

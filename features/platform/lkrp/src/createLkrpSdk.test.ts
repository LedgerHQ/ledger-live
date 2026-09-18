import { LkrpNotImplementedError } from "@shared/lkrp";
import { createHwDeviceLayer } from "./createHwDeviceLayer";
import { createLkrpIdentityProvider } from "./createLkrpIdentityProvider";
import { createLkrpSdk } from "./createLkrpSdk";
import type {
  LkrpBlock,
  LkrpCrypto,
  LkrpKey,
  LkrpKeyStore,
  LkrpStream,
  TrustchainBackend,
  TrustchainSnapshot,
} from "@shared/lkrp";

const key: LkrpKey = {
  id: "member-key",
  publicKey: Uint8Array.from([1]),
};

const crypto: LkrpCrypto = {
  encryptFor: (_publicKey, plaintext) => Promise.resolve(plaintext),
};

const keyStore: LkrpKeyStore = {
  create: () => Promise.resolve(key),
  load: () => Promise.resolve(null),
  decryptWith: (_key, ciphertext) => Promise.resolve(ciphertext),
};

const backend: TrustchainBackend = {
  list: () => Promise.resolve([]),
  read: (rootId: string): Promise<TrustchainSnapshot> =>
    Promise.resolve({ rootId, nodes: [], streams: [] }),
  create: (_root: LkrpBlock) => Promise.resolve("root"),
  append: (_rootId: string, _stream: LkrpStream) => Promise.resolve(),
  remove: () => Promise.resolve(),
};

describe("platform LKRP glue", () => {
  it("composes the shared SDK from Wallet-owned adapters", async () => {
    const sdk = createLkrpSdk({ crypto, keyStore, backend });

    expect(sdk.capabilities).toEqual({ device: false });
    await expect(sdk.createLocalKeyPair("member")).resolves.toEqual(key);
  });

  it("exposes an unimplemented hardware device adapter", async () => {
    await expect(
      createHwDeviceLayer({ deviceId: "usb" }).execute({ type: "close-stream", path: "m/" }),
    ).rejects.toEqual(expect.objectContaining({ name: LkrpNotImplementedError.name }));
  });

  it("exposes an unimplemented identity provider", async () => {
    await expect(
      createLkrpIdentityProvider(() => ({
        memberKeyId: null,
        trustchainRootId: null,
      })).authenticate({
        challenge: {},
      }),
    ).rejects.toEqual(expect.objectContaining({ name: LkrpNotImplementedError.name }));
  });
});

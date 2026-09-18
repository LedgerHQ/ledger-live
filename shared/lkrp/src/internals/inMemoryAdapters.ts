import type {
  LkrpCrypto,
  LkrpDeviceLayer,
  LkrpDeviceRequest,
  LkrpDeviceResponse,
  LkrpKeyStore,
  TrustchainBackend,
} from "../ports";
import type { LkrpBlock, LkrpKey, LkrpStream, TrustchainSnapshot } from "../types";

const publicKey = Uint8Array.from([1, 2, 3]);
const testKey = { id: "test-key", publicKey };

export class InMemoryCrypto implements LkrpCrypto {
  encryptFor(_publicKey: Uint8Array, plaintext: Uint8Array): Promise<Uint8Array> {
    return Promise.resolve(plaintext);
  }
}

export class InMemoryKeyStore implements LkrpKeyStore {
  private readonly entries = new Map<string, LkrpKey>();

  create(alias: string): Promise<LkrpKey> {
    this.entries.set(alias, testKey);
    return Promise.resolve(testKey);
  }

  load(alias: string): Promise<LkrpKey | null> {
    return Promise.resolve(this.entries.get(alias) ?? null);
  }

  decryptWith(_key: LkrpKey, ciphertext: Uint8Array): Promise<Uint8Array> {
    return Promise.resolve(ciphertext);
  }
}

export class InMemoryTrustchainBackend implements TrustchainBackend {
  list(): Promise<readonly string[]> {
    return Promise.resolve([]);
  }

  read(rootId: string): Promise<TrustchainSnapshot> {
    return Promise.resolve({ rootId, nodes: [], streams: [] });
  }

  create(_root: LkrpBlock): Promise<string> {
    return Promise.resolve("test-root");
  }

  append(_rootId: string, _stream: LkrpStream): Promise<void> {
    return Promise.resolve();
  }

  remove(_rootId: string): Promise<void> {
    return Promise.resolve();
  }
}

export class NoopDeviceLayer implements LkrpDeviceLayer {
  execute(_request: LkrpDeviceRequest): Promise<LkrpDeviceResponse> {
    return Promise.resolve({ blocks: [] });
  }
}

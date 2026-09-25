import type {
  LkrpBlock,
  LkrpKey,
  LkrpStream,
  MemberCredentials,
  TrustchainSnapshot,
} from "./types";

export interface LkrpCrypto {
  encryptFor(publicKey: Uint8Array, plaintext: Uint8Array): Promise<Uint8Array>;
}

export interface LkrpKeyStore {
  create(alias: string): Promise<LkrpKey>;
  load(alias: string): Promise<LkrpKey | null>;
  decryptWith(key: LkrpKey, ciphertext: Uint8Array): Promise<Uint8Array>;
}

export interface LkrpAuthorization {
  getAccessToken(): Promise<string>;
}

export interface TrustchainBackend {
  list(): Promise<readonly string[]>;
  read(rootId: string): Promise<TrustchainSnapshot>;
  create(root: LkrpBlock): Promise<string>;
  append(rootId: string, stream: LkrpStream): Promise<void>;
  remove(rootId: string): Promise<void>;
}

export type TrustchainHttpBackendConfig = {
  readonly baseUrl: string;
  readonly fetch: typeof fetch;
  readonly authorization?: LkrpAuthorization;
};

export type LkrpDeviceRequest =
  | { readonly type: "create-root"; readonly credentials: MemberCredentials }
  | { readonly type: "derive-stream"; readonly path: string }
  | {
      readonly type: "share-key";
      readonly path: string;
      readonly recipient: Uint8Array;
    }
  | { readonly type: "close-stream"; readonly path: string }
  | { readonly type: "read-key"; readonly path: string };

export type LkrpDeviceResponse = {
  readonly blocks: readonly LkrpBlock[];
  readonly key?: LkrpKey;
};

export interface LkrpDeviceLayer {
  execute(request: LkrpDeviceRequest): Promise<LkrpDeviceResponse>;
}

export interface LkrpCommandStreamCodec {
  encode(stream: LkrpStream): Uint8Array;
  decode(bytes: Uint8Array): LkrpStream;
}

export type LkrpSdkDependencies = {
  readonly crypto: LkrpCrypto;
  readonly backend: TrustchainBackend;
  readonly keyStore: LkrpKeyStore;
  readonly device?: LkrpDeviceLayer;
};

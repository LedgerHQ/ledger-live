import { LkrpNotImplementedError } from "./errors";
import type { LkrpSdkDependencies } from "./ports";
import type {
  AddMemberInput,
  CreateTrustchainInput,
  DestroyApplicationResult,
  LkrpKey,
  MemberCredentials,
  RemoveMemberInput,
  Trustchain,
  TrustchainMember,
  TrustchainResult,
  TrustchainSnapshot,
} from "./types";

export type LkrpSdkCapabilities = {
  readonly device: boolean;
};

export class LkrpSdk {
  readonly capabilities: LkrpSdkCapabilities;

  constructor(private readonly dependencies: LkrpSdkDependencies) {
    this.capabilities = { device: dependencies.device !== undefined };
  }

  createLocalKeyPair(alias: string): Promise<LkrpKey> {
    return this.dependencies.keyStore.create(alias);
  }

  loadLocalKeyPair(alias: string): Promise<LkrpKey | null> {
    return this.dependencies.keyStore.load(alias);
  }

  readTrustchain(rootId: string): Promise<TrustchainSnapshot> {
    return this.dependencies.backend.read(rootId);
  }

  encryptFor(publicKey: Uint8Array, plaintext: Uint8Array): Promise<Uint8Array> {
    return this.dependencies.crypto.encryptFor(publicKey, plaintext);
  }

  decryptWith(key: LkrpKey, ciphertext: Uint8Array): Promise<Uint8Array> {
    return this.dependencies.keyStore.decryptWith(key, ciphertext);
  }

  getOrCreateTrustchain(_input: CreateTrustchainInput): Promise<TrustchainResult> {
    return this.notImplemented("getOrCreateTrustchain");
  }

  restoreTrustchain(_trustchain: Trustchain, _credentials: MemberCredentials): Promise<Trustchain> {
    return this.notImplemented("restoreTrustchain");
  }

  getMembers(
    _trustchain: Trustchain,
    _credentials: MemberCredentials,
  ): Promise<readonly TrustchainMember[]> {
    return this.notImplemented("getMembers");
  }

  addMember(_input: AddMemberInput): Promise<Trustchain> {
    return this.notImplemented("addMember");
  }

  removeMember(_input: RemoveMemberInput): Promise<Trustchain> {
    return this.notImplemented("removeMember");
  }

  destroyTrustchain(_trustchain: Trustchain, _credentials: MemberCredentials): Promise<void> {
    return this.notImplemented("destroyTrustchain");
  }

  destroyApplication(
    _trustchain: Trustchain,
    _credentials: MemberCredentials,
  ): Promise<DestroyApplicationResult> {
    return this.notImplemented("destroyApplication");
  }

  private notImplemented<T>(operation: string): Promise<T> {
    return Promise.reject(new LkrpNotImplementedError(operation));
  }
}

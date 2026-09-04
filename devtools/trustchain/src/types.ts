// ─────────────────────────────────────────────────────────────────────────────
// Structural contracts — no dependency on @ledgerhq/* libs.
// The bindings layer provides implementations that satisfy these interfaces
// via TypeScript structural compatibility.
// ─────────────────────────────────────────────────────────────────────────────

export interface Trustchain {
  rootId: string;
  walletSyncEncryptionKey: string;
  applicationPath: string;
}

export interface MemberCredentials {
  pubkey: string;
  privatekey: string;
}

export interface TrustchainMember {
  id: string;
  name: string;
  permissions: number;
}

export interface TrustchainDeviceCallbacks {
  onStartRequestUserInteraction?: () => void;
  onEndRequestUserInteraction?: () => void;
}

export enum TrustchainResultType {
  created = "created",
  updated = "updated",
  restored = "restored",
}

export type TrustchainResult = {
  type: TrustchainResultType;
  trustchain: Trustchain;
};

export interface TrustchainSDK {
  initMemberCredentials(): Promise<MemberCredentials>;
  getOrCreateTrustchain(
    deviceId: string,
    memberCredentials: MemberCredentials,
    callbacks?: TrustchainDeviceCallbacks,
  ): Promise<TrustchainResult>;
  restoreTrustchain(
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
  ): Promise<Trustchain>;
  getMembers(
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
  ): Promise<TrustchainMember[]>;
  removeMember(
    deviceId: string,
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
    member: TrustchainMember,
    callbacks?: TrustchainDeviceCallbacks,
  ): Promise<Trustchain>;
  destroyTrustchain(trustchain: Trustchain, memberCredentials: MemberCredentials): Promise<void>;
  destroyApplication(
    trustchain: Trustchain,
    memberCredentials: MemberCredentials,
  ): Promise<{ trustchainDestroyed: boolean }>;
  encryptUserData(trustchain: Trustchain, data: Uint8Array): Promise<Uint8Array>;
  decryptUserData(trustchain: Trustchain, data: Uint8Array): Promise<Uint8Array>;
  invalidateJwt(): void;
}

/** Snapshot of the host app's current trustchain Redux state. */
export interface TrustchainLiveState {
  readonly memberCredentials: MemberCredentials | null;
  readonly trustchain: Trustchain | null;
}

/** Props contract for the Trustchain DevTool. Built by `@devtools/bindings`. */
export interface TrustchainDevToolProps {
  readonly liveState: TrustchainLiveState | null;
  readonly createSdk: (options: { trustchainApiBaseUrl: string }) => TrustchainSDK;
  readonly trustchainApiBaseUrl: string;
  readonly useProd?: boolean;
  readonly setUseProd?: (v: boolean) => void;
  /** Called when the tool establishes or clears member credentials — write back to the app's store. */
  readonly onMemberCredentialsChange?: (mc: MemberCredentials | null) => void;
  /** Called when the tool establishes or clears a trustchain — write back to the app's store. */
  readonly onTrustchainChange?: (tc: Trustchain | null) => void;
}

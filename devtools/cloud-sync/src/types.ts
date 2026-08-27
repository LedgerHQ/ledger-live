// Trustchain + MemberCredentials come from @shared/cloud-sync's own local
// structural copies (it already avoids pulling in @ledgerhq/ledger-key-ring-protocol).
import type { MemberCredentials, Trustchain, TrustchainSDK } from "@shared/cloud-sync";

/** Snapshot of the host app's current trustchain Redux state. */
export interface TrustchainLiveState {
  readonly memberCredentials: MemberCredentials | null;
  readonly trustchain: Trustchain | null;
}

/** Props contract for the Cloud Sync DevTool. Built by `@devtools/bindings`. */
export interface CloudSyncDevToolProps {
  readonly liveState: TrustchainLiveState | null;
  readonly createSdk: (options: { trustchainApiBaseUrl: string }) => TrustchainSDK;
  readonly cloudSyncApiBaseUrl: string;
  readonly trustchainApiBaseUrl: string;
  readonly walletSyncVersion?: number;
  readonly useProd?: boolean;
  readonly setUseProd?: (v: boolean) => void;
}

import type {
  Intent,
  IntentDefinition,
  IntentPlatformDefinition,
} from "@features/platform-device-intent";
import type {
  MemberCredentials,
  Trustchain,
  TrustchainResult,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import type { CreateSessionSdk } from "../../session";
import type { LedgerSyncJobState } from "../../jobState";

export type AddMemberIntentInput = Readonly<{
  memberCredentials: MemberCredentials;
  /** The trustchain this instance already knows, so the SDK restores it instead of creating one. */
  currentTrustchain?: Trustchain;
  createSessionSdk: CreateSessionSdk;
}>;

export type AddMemberJobState = LedgerSyncJobState;

export type AddMemberIntentDefinition = IntentDefinition<
  AddMemberJobState,
  AddMemberIntentInput,
  TrustchainResult
>;

export type AddMemberIntentPlatformDefinition<ExtraProps = undefined> = IntentPlatformDefinition<
  AddMemberJobState,
  AddMemberIntentInput,
  ExtraProps,
  TrustchainResult
>;

export type AddMemberIntent<ExtraProps = undefined> = Intent<
  AddMemberJobState,
  AddMemberIntentInput,
  ExtraProps,
  TrustchainResult
>;

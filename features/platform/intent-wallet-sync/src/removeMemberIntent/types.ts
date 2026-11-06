import type {
  Intent,
  IntentDefinition,
  IntentPlatformDefinition,
} from "@features/platform-device-intent";
import type {
  MemberCredentials,
  Trustchain,
  TrustchainMember,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import type { CreateSessionSdk } from "../createSessionSdk";
import type { LedgerSyncJobState } from "../ledgerSyncJobState";

export type RemoveMemberIntentInput = Readonly<{
  trustchain: Trustchain;
  memberCredentials: MemberCredentials;
  member: TrustchainMember;
  createSessionSdk: CreateSessionSdk;
}>;

export type RemoveMemberJobState = LedgerSyncJobState;

export type RemoveMemberIntentDefinition = IntentDefinition<
  RemoveMemberJobState,
  RemoveMemberIntentInput,
  Trustchain
>;

export type RemoveMemberIntentPlatformDefinition<ExtraProps = undefined> = IntentPlatformDefinition<
  RemoveMemberJobState,
  RemoveMemberIntentInput,
  ExtraProps,
  Trustchain
>;

export type RemoveMemberIntent<ExtraProps = undefined> = Intent<
  RemoveMemberJobState,
  RemoveMemberIntentInput,
  ExtraProps,
  Trustchain
>;

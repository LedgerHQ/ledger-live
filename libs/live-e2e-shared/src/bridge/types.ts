import type { Contact } from "@domain/entity-contact";
import type { LiveAppManifest } from "@ledgerhq/live-common/platform/types";
import type { TrustchainStore } from "@ledgerhq/ledger-key-ring-protocol/store";
import type { AccountRaw, PostOnboardingState } from "@ledgerhq/types-live";
import type { Feature, FeatureId, PartialFeatures } from "@shared/feature-flags";

export type BridgePayloads = {
  settings: unknown;
  payCard: unknown;
  receiveVerifyHint: unknown;
};

export type OverrideFeatureFlagPayload = { id: FeatureId; value: Feature | undefined };

export type ServerData =
  | {
      type: "walletAPIResponse";
      payload: Record<string, unknown>;
    }
  | {
      type: "appLogs";
      id: string;
      payload: string;
    }
  | {
      type: "appFile";
      payload: string;
    }
  | {
      type: "appFlags";
      id: string;
      payload: string;
    }
  | {
      type: "appEnvs";
      id: string;
      payload: string;
    }
  | {
      type: "ptxHandoff";
      id: string;
      payload: string;
    }
  | { type: "contactsImported"; id: string; payload: "" }
  | { type: "localManifestsImported"; id: string; payload: string }
  | { type: "ACK"; id: string }
  | { type: "swapSetupDone"; id: string }
  | { type: "swapLiveAppReady" }
  | { type: "earnLiveAppReady" };

export type MessageData<P extends BridgePayloads = BridgePayloads> =
  | { type: "acceptTerms"; id: string }
  | { type: "addKnownSpeculos"; id: string; payload: string }
  | { type: "removeKnownSpeculos"; id: string; payload: string }
  | { type: "getLogs"; id: string }
  | { type: "getFlags"; id: string }
  | { type: "getEnvs"; id: string }
  | { type: "getPtxHandoff"; id: string }
  | { type: "navigate"; id: string; payload: string }
  | { type: "importSettings"; id: string; payload: P["settings"] }
  | {
      type: "importAccounts";
      id: string;
      payload: {
        data: AccountRaw;
        version: number;
      }[];
    }
  | { type: "importTrustchain"; id: string; payload: TrustchainStore }
  | { type: "importContacts"; id: string; payload: Contact[] }
  | { type: "importLocalManifests"; id: string; payload: LiveAppManifest[] }
  | { type: "importPostOnboarding"; id: string; payload: Partial<PostOnboardingState> }
  | { type: "importPayCard"; id: string; payload: P["payCard"] }
  | { type: "importReceiveVerifyHint"; id: string; payload: P["receiveVerifyHint"] }
  | { type: "overrideUserId"; id: string; payload: string }
  | { type: "overrideFeatureFlags"; id: string; payload: PartialFeatures }
  | { type: "overrideFeatureFlag"; id: string; payload: OverrideFeatureFlagPayload }
  | { type: "overrideLiveConfig"; id: string; payload: Record<string, unknown> }
  | { type: "setGlobals"; id: string; payload: { [key: string]: unknown } }
  | { type: "swapSetup"; id: string; swapApiBase?: string }
  | { type: "waitSwapReady"; id: string }
  | { type: "waitEarnReady"; id: string }
  | { type: "ACK"; id: string };

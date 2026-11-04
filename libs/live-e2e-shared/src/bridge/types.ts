import type { Contact } from "@domain/entity-contact";
import type { DescriptorEventType } from "@ledgerhq/hw-transport";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { Event as AppEvent } from "@ledgerhq/live-common/hw/actions/app";
import type { ConnectAppEvent } from "@ledgerhq/live-common/hw/connectApp";
import type { ConnectManagerEvent } from "@ledgerhq/live-common/hw/connectManager";
import type { InstallLanguageEvent } from "@ledgerhq/live-common/hw/installLanguage";
import type { LoadImageEvent } from "@ledgerhq/live-common/hw/customLockScreenLoad";
import type { FetchImageEvent } from "@ledgerhq/live-common/hw/customLockScreenFetch";
import type { ExchangeRequestEvent } from "@ledgerhq/live-common/hw/actions/startExchange";
import type { CompleteExchangeRequestEvent } from "@ledgerhq/live-common/exchange/platform/types";
import type { RemoveImageEvent } from "@ledgerhq/live-common/hw/customLockScreenRemove";
import type { RenameDeviceEvent } from "@ledgerhq/live-common/hw/renameDevice";
import type { TrustchainStore } from "@ledgerhq/ledger-key-ring-protocol/store";
import type { AccountRaw, PostOnboardingState } from "@ledgerhq/types-live";
import type { Feature, FeatureId, PartialFeatures } from "@shared/feature-flags";

export type BridgePayloads = {
  settings: unknown;
  ble: unknown;
  payCard: unknown;
};

export type OverrideFeatureFlagPayload = { id: FeatureId; value: Feature | undefined };

export interface DeviceUSB extends Device {
  deviceName: string;
  productId: number;
  vendorId: number;
}

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
  | { type: "ACK"; id: string }
  | { type: "swapSetupDone"; id: string }
  | { type: "swapLiveAppReady" }
  | { type: "earnLiveAppReady" };

export type MessageData<P extends BridgePayloads = BridgePayloads> =
  | {
      type: DescriptorEventType;
      id: string;
      payload: { id: string; name: string; serviceUUID: string };
    }
  | { type: "open"; id: string }
  | { type: "mockDeviceEvent"; id: string; payload: MockDeviceEvent[] }
  | { type: "acceptTerms"; id: string }
  | { type: "addUSB"; id: string; payload: DeviceUSB }
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
  | { type: "importBle"; id: string; payload: P["ble"] }
  | { type: "importPostOnboarding"; id: string; payload: Partial<PostOnboardingState> }
  | { type: "importPayCard"; id: string; payload: P["payCard"] }
  | { type: "overrideFeatureFlags"; id: string; payload: PartialFeatures }
  | { type: "overrideFeatureFlag"; id: string; payload: OverrideFeatureFlagPayload }
  | { type: "overrideLiveConfig"; id: string; payload: Record<string, unknown> }
  | { type: "setGlobals"; id: string; payload: { [key: string]: unknown } }
  | { type: "swapSetup"; id: string; swapApiBase?: string }
  | { type: "waitSwapReady"; id: string }
  | { type: "waitEarnReady"; id: string }
  | { type: "ACK"; id: string };

export type MockDeviceEvent =
  | ConnectAppEvent
  | AppEvent
  | ConnectManagerEvent
  | InstallLanguageEvent
  | LoadImageEvent
  | FetchImageEvent
  | ExchangeRequestEvent
  | RemoveImageEvent
  | RenameDeviceEvent
  | CompleteExchangeRequestEvent
  | { type: "complete" };

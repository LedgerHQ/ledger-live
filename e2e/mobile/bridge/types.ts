import { DescriptorEventType } from "@ledgerhq/hw-transport";
import { AccountRaw } from "@ledgerhq/types-live";
import { SettingsState } from "~/reducers/types";
import { SettingsSetOverriddenFeatureFlagsPlayload } from "~/actions/types";

export type ServerData =
  | {
      type: "walletAPIResponse";
      payload: Record<string, unknown>;
    }
  | {
      type: "appLogs";
      payload: string;
    }
  | {
      type: "appFlags";
      payload: string;
    }
  | {
      type: "appEnvs";
      payload: string;
    }
  | { type: "ACK"; id: string }
  | { type: "swapLiveAppReady" };

export type MessageData =
  | {
      type: DescriptorEventType;
      id: string;
      payload: { id: string; name: string; serviceUUID: string };
    }
  | { type: "acceptTerms"; id: string }
  | { type: "addKnownSpeculos"; id: string; payload: string }
  | { type: "removeKnownSpeculos"; id: string; payload: string }
  | { type: "getLogs"; id: string }
  | { type: "getFlags"; id: string }
  | { type: "getEnvs"; id: string }
  | { type: "navigate"; id: string; payload: string }
  | { type: "importSettings"; id: string; payload: Partial<SettingsState> }
  | {
      type: "importAccounts";
      id: string;
      payload: {
        data: AccountRaw;
        version: number;
      }[];
    }
  | { type: "overrideFeatureFlags"; id: string; payload: SettingsSetOverriddenFeatureFlagsPlayload }
  | { type: "swapSetup"; id: string }
  | { type: "waitSwapReady"; id: string }
  | { type: "ACK"; id: string };

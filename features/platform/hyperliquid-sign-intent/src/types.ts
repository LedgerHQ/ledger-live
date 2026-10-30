import type { DeviceModelId } from "@ledgerhq/device-management-kit";
import type {
  DeviceConnectionResult,
  Intent,
  IntentDefinition,
  IntentPlatformDefinition,
} from "@features/platform-device-intent";

export type HyperliquidSignature = {
  readonly r: string;
  readonly s: string;
  readonly v: number;
};

export type HyperliquidSignSession = Pick<
  DeviceConnectionResult,
  "dmk" | "sessionId" | "connectedDevice"
>;

/** Host-injected signer. The Hyperliquid app is already open (DIE Phase 2). */
export type SignHyperliquidActionsOnSession = (
  session: HyperliquidSignSession,
) => Promise<HyperliquidSignature[]>;

export type HyperliquidSignIntentInput = {
  readonly signOnSession: SignHyperliquidActionsOnSession;
};

export type HyperliquidSignIntentJobState =
  | {
      readonly type: "signing";
      readonly deviceModelId: DeviceModelId;
      readonly deviceName: string;
    }
  | { readonly type: "signed" }
  | { readonly type: "refused" }
  | { readonly type: "error"; readonly error: Error };

export type HyperliquidSignIntentResult =
  | { readonly type: "signed"; readonly signatures: HyperliquidSignature[] }
  | { readonly type: "refused"; readonly error: Error }
  | { readonly type: "failed"; readonly error: Error };

export type HyperliquidSignIntentDefinition = IntentDefinition<
  HyperliquidSignIntentJobState,
  HyperliquidSignIntentInput,
  HyperliquidSignIntentResult
>;

export type HyperliquidSignIntentPlatformDefinition<ExtraProps = undefined> =
  IntentPlatformDefinition<
    HyperliquidSignIntentJobState,
    HyperliquidSignIntentInput,
    ExtraProps,
    HyperliquidSignIntentResult
  >;

export type HyperliquidSignIntent<ExtraProps = undefined> = Intent<
  HyperliquidSignIntentJobState,
  HyperliquidSignIntentInput,
  ExtraProps,
  HyperliquidSignIntentResult
>;

import { LedgerDevices } from "@ledgerhq/lumen-ui-react/symbols";
import type { PostOnboardingActionId, StartActionArgs } from "@ledgerhq/types-live";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { ComponentProps, ComponentType } from "react";

/** Lumen finish-flow list symbols share the same `size` contract (used with `createElement` in the view). */
export type FinishFlowLumenSymbol = ComponentType<ComponentProps<typeof LedgerDevices>>;

/**
 * i18n key paths (e.g. `postOnboarding.actions.buyCrypto.title`) for
 * this list row. Pair keys with the same `postOnboardingActionId` in your locales.
 */
export type PostOnboardingActionI18nKeys = {
  readonly description: string;
  readonly title: string;
};

/**
 * Props for a post-onboarding list row in the “finish setup” / portfolio widget flow.
 * Title fields are i18n keys, not final copy. Hub wiring (`startAction`, analytics, …)
 * matches the live-common `PostOnboardingAction` model where applicable.
 */
export type PostOnboardingActionProps = PostOnboardingActionI18nKeys & {
  readonly buttonLabelForAnalyticsEvent: string;
  readonly completed: boolean;
  readonly deviceModelId: DeviceModelId | null;
  /** Lumen symbol for the list row leading visual when the action is not completed. */
  readonly lumenSymbol: FinishFlowLumenSymbol;
  readonly postOnboardingActionId: PostOnboardingActionId;
  readonly shouldCompleteOnStart: boolean;
  readonly startAction: (args: StartActionArgs) => void;
  readonly testId?: string;
};

export type PostOnboardingActionViewProps = PostOnboardingActionI18nKeys & {
  readonly completed: boolean;
  readonly lumenSymbol: FinishFlowLumenSymbol;
  readonly onRowActivate: () => void;
  readonly postOnboardingActionId: PostOnboardingActionId;
  readonly testId: string;
};

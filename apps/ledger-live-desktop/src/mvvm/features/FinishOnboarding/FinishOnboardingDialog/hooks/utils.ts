import {
  LedgerDevices,
  PictureImage,
  Plus,
  Refresh,
  ShieldLock,
} from "@ledgerhq/lumen-ui-react/symbols";
import {
  type PostOnboardingAction,
  type PostOnboardingActionState,
  PostOnboardingActionId,
  type StartActionArgs,
} from "@ledgerhq/types-live";

import type { FinishFlowLumenSymbol } from "LLD/features/FinishOnboarding/FinishOnboardingDialog/components/PostOnboardingAction/types";

/**
 * Maps a post-onboarding action id to the Lumen symbol for the finish-onboarding list
 * (incomplete rows, rendered without a `Spot` wrapper to avoid a muted round background).
 */
export function getLumenSymbolForActionId(id: PostOnboardingActionId): FinishFlowLumenSymbol {
  switch (id) {
    case PostOnboardingActionId.assetsTransfer:
      return Plus as FinishFlowLumenSymbol;
    case PostOnboardingActionId.customImage:
      return PictureImage as FinishFlowLumenSymbol;
    case PostOnboardingActionId.deviceOnboarded:
      return LedgerDevices as FinishFlowLumenSymbol;
    case PostOnboardingActionId.recover:
      return ShieldLock as FinishFlowLumenSymbol;
    case PostOnboardingActionId.syncAccounts:
      return Refresh as FinishFlowLumenSymbol;
    default:
      return LedgerDevices as FinishFlowLumenSymbol;
  }
}

/** Not shown in the finish-onboarding dialog / widget (hub-only). */
export const EXCLUDED_FROM_FINISH_FLOW_ID = PostOnboardingActionId.buyCrypto;

/**
 * How many “extra” steps the finish stepper counts for the first row, because
 * `FinishOnboardingDialogView` hardcodes a `PostOnboardingActionId.deviceOnboarded`
 * row (always complete) *above* the `actionList` from the hook. The widget
 * reuses the same `completedActionsAmount` / `totalActionsAmount` so the
 * portfolio stepper lines up with that first implicit step. Hub-derived
 * `allActionsCompleted` in the hook does *not* apply this offset.
 */
export const IMPLICIT_DEVICE_STEP_OFFSET = 1;

/** i18n segment under `postOnboarding.dialog.actions` (see `static/i18n/.../app.json`). */
const ACTION_ID_TO_DIALOG_GROUP: Readonly<Partial<Record<PostOnboardingActionId, string>>> = {
  [PostOnboardingActionId.deviceOnboarded]: "deviceOnboarded",
  [PostOnboardingActionId.assetsTransfer]: "assetsTransfer",
  [PostOnboardingActionId.syncAccounts]: "syncAccounts",
  [PostOnboardingActionId.customImage]: "customImage",
  [PostOnboardingActionId.recover]: "recover",
};

/** `deviceOnboarded` in dialog copy has title only. */
const DIALOG_GROUPS_WITH_DESCRIPTION: ReadonlySet<string> = new Set([
  "assetsTransfer",
  "syncAccounts",
  "customImage",
  "recover",
]);

type ActionWithI18nKeys = PostOnboardingAction & PostOnboardingActionState;

/**
 * Hub action + state, plus the Lumen leading symbol and dialog i18n keys so the
 * finish dialog / widget list can render rows without further mapping.
 */
export type FinishPostOnboardingListItem = PostOnboardingAction &
  PostOnboardingActionState & {
    readonly lumenSymbol: FinishFlowLumenSymbol;
  };

/**
 * Attaches the {@link FinishPostOnboardingListItem.lumenSymbol} for the row
 * (used when the action is not completed).
 */
export function withFinishListLumenSymbol<T extends ActionWithI18nKeys>(
  action: T,
): T & { readonly lumenSymbol: FinishFlowLumenSymbol } {
  return {
    ...action,
    lumenSymbol: getLumenSymbolForActionId(action.id),
  };
}

/**
 * Replaces `title` on the action with
 * `postOnboarding.dialog.actions.<group>.title` when a dialog group exists for
 * the action id. Unmapped and mock action ids are left unchanged. (`titleCompleted`
 * is not read in the finish dialog list.)
 */
export function withFinishDialogActionTitles<T extends ActionWithI18nKeys>(action: T): T {
  const group = ACTION_ID_TO_DIALOG_GROUP[action.id];
  if (!group) {
    return action;
  }
  return {
    ...action,
    title: `postOnboarding.dialog.actions.${group}.title`,
  };
}

/**
 * Replaces `description` with `postOnboarding.dialog.actions.<group>.description` when
 * the dialog defines a description for that group. `deviceOnboarded` is title-only in
 * dialog copy; the previous hub keys are left as-is in that case.
 */
export function withFinishDialogActionDescription<T extends ActionWithI18nKeys>(action: T): T {
  const group = ACTION_ID_TO_DIALOG_GROUP[action.id];
  if (!group || !DIALOG_GROUPS_WITH_DESCRIPTION.has(group)) {
    return action;
  }
  return {
    ...action,
    description: `postOnboarding.dialog.actions.${group}.description`,
  };
}

/**
 * Maps a hub post-onboarding action to a list item ready for
 * `FinishOnboardingDialogView` / consumers: Lumen symbol, `title` and
 * `description` use `postOnboarding.dialog.actions` keys where defined.
 */
export function toFinishPostOnboardingListItem(
  action: PostOnboardingAction & PostOnboardingActionState,
): FinishPostOnboardingListItem {
  return withFinishDialogActionDescription(
    withFinishDialogActionTitles(withFinishListLumenSymbol(action)),
  );
}

/**
 * `PostOnboardingAction` always expects a `startAction` callback. For hub rows that
 * define one, return it; otherwise return a no-op (e.g. some mocks that omit the handler).
 */
export function resolveFinishPostOnboardingStartAction(
  item: FinishPostOnboardingListItem,
): (args: StartActionArgs) => void {
  if ("startAction" in item && item.startAction) {
    return item.startAction;
  }
  return () => {};
}

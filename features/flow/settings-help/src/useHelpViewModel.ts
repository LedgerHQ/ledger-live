import { useCallback, useState } from "react";
import type { SettingsConfirmSheetProps } from "@features/flow-settings";
import { track } from "@shared/analytics";
import { useOpenLink } from "@shared/linking";
import { useHelpLabels } from "./copy/useHelpLabels";
import {
  HELP_CONFIRMATION_SCREENS,
  HELP_GROUPS,
  HELP_ITEM_ACTIONS,
  HELP_ITEM_EVENTS,
  isConfirmedHelpItem,
  type HelpGroupId,
  type HelpItemAction,
  type HelpItemId,
  type HelpConfirmedItemId,
} from "./logic/helpItems";
import type { HelpPort } from "./ports";

export type HelpRowViewModel = Readonly<{
  id: HelpItemId;
  title: string;
  description: string;
  action: HelpItemAction;
  actionLabel?: string;
  /** Absent for `slot` rows, which the app renders. */
  onPress?: () => void;
  destructive: boolean;
}>;

export type HelpGroupViewModel = Readonly<{
  id: HelpGroupId;
  title: string;
  rows: readonly HelpRowViewModel[];
}>;

export type HelpViewModel = Readonly<{
  title: string;
  groups: readonly HelpGroupViewModel[];
  confirmation: SettingsConfirmSheetProps;
  confirmationScreenName: string | null;
}>;

export function useHelpViewModel(port: HelpPort): HelpViewModel {
  const labels = useHelpLabels();
  const openLink = useOpenLink();
  const [confirmation, setConfirmation] = useState<{ id: HelpConfirmedItemId; isOpen: boolean }>({
    id: "clearCache",
    isOpen: false,
  });
  const [isConfirming, setIsConfirming] = useState(false);
  const closeConfirmation = useCallback(
    () => setConfirmation(current => ({ ...current, isOpen: false })),
    [],
  );

  const confirm = useCallback(
    async (id: HelpConfirmedItemId) => {
      setIsConfirming(true);
      try {
        await (id === "clearCache" ? port.clearCache() : port.resetApp());
      } finally {
        setIsConfirming(false);
        closeConfirmation();
      }
    },
    [port, closeConfirmation],
  );

  const onPressByItem: Partial<Record<HelpItemId, () => void>> = {
    support: () => openLink(port.links.support),
    academy: () => openLink(port.links.academy),
    status: () => openLink(port.links.status),
    viewUserData: () => port.viewUserData(),
    launchOnboarding: () => port.launchOnboarding(),
  };

  const toRow = (id: HelpItemId): HelpRowViewModel => {
    const itemLabels = labels.items[id];
    const action = isConfirmedHelpItem(id)
      ? () => setConfirmation({ id, isOpen: true })
      : onPressByItem[id];
    const event = HELP_ITEM_EVENTS[id];
    const onPress = action
      ? () => {
          if (event) void track(event);
          action();
        }
      : undefined;
    return {
      id,
      title: itemLabels.title,
      description: itemLabels.description,
      action: HELP_ITEM_ACTIONS[id],
      actionLabel: itemLabels.action,
      onPress,
      destructive: id === "resetApp",
    };
  };

  const groups = HELP_GROUPS.map(group => ({
    id: group.id,
    title: labels.groups[group.id],
    rows: group.items.map(toRow),
  }));

  return {
    title: labels.title,
    groups,
    confirmation: {
      isOpen: confirmation.isOpen,
      tone: "destructive",
      labels: labels.confirmations[confirmation.id],
      isConfirming,
      onConfirm: () => {
        if (confirmation.isOpen) void confirm(confirmation.id);
      },
      onCancel: closeConfirmation,
      testID: "settings-help-confirm",
      confirmTestID: "settings-help-confirm-button",
      cancelTestID: "settings-help-cancel-button",
    },
    confirmationScreenName: confirmation.isOpen ? HELP_CONFIRMATION_SCREENS[confirmation.id] : null,
  };
}

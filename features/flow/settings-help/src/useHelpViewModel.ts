import { useCallback, useState } from "react";
import type { SettingsConfirmSheetProps } from "@features/flow-settings";
import { track } from "@shared/analytics";
import { useOpenLink } from "@shared/linking";
import { useHelpLabels } from "./copy/useHelpLabels";
import {
  getHelpConfirmationTone,
  getHelpGroups,
  getHelpItemAction,
  isConfirmedHelpItem,
  type HelpGroupId,
  type HelpItemAction,
  type HelpItemId,
  type HelpConfirmedItemId,
} from "./logic/helpItems";
import {
  getHelpConfirmationScreen,
  getHelpItemEvent,
  HELP_SCREENS,
  type HelpScreen,
} from "./logic/helpTracking";
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
  screen: HelpScreen;
  confirmationScreenName: string | null;
}>;

function getItemActions(
  port: HelpPort,
  openLink: (url: string) => void,
): Partial<Record<HelpItemId, () => void>> {
  const linkActions = {
    support: () => openLink(port.links.support),
    academy: () => openLink(port.links.academy),
    status: () => openLink(port.links.status),
  };
  if (port.platform === "mobile") return { ...linkActions, saveLogs: () => port.saveLogs() };
  return {
    ...linkActions,
    viewUserData: () => port.viewUserData(),
    launchOnboarding: () => port.launchOnboarding(),
  };
}

function runConfirmedItem(port: HelpPort, id: HelpConfirmedItemId): Promise<void> {
  if (id === "clearCache") return port.clearCache();
  return port.platform === "desktop" ? port.resetApp() : Promise.resolve();
}

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
        await runConfirmedItem(port, id);
      } finally {
        setIsConfirming(false);
        closeConfirmation();
      }
    },
    [port, closeConfirmation],
  );

  const actionsByItem = getItemActions(port, openLink);
  const supportOpensChatbot = port.platform === "mobile" && port.supportOpensChatbot;

  const toRows = (id: HelpItemId): HelpRowViewModel[] => {
    const itemLabels = labels.items[id];
    if (!itemLabels) return [];
    const action = isConfirmedHelpItem(id)
      ? () => setConfirmation({ id, isOpen: true })
      : actionsByItem[id];
    const event = getHelpItemEvent(id, port.platform);
    const onPress = action
      ? () => {
          if (event?.properties) void track(event.event, event.properties);
          else if (event) void track(event.event);
          action();
        }
      : undefined;
    const title =
      id === "support" && supportOpensChatbot
        ? (labels.chatbotSupportTitle ?? itemLabels.title)
        : itemLabels.title;
    return [
      {
        id,
        title,
        description: itemLabels.description,
        action: getHelpItemAction(id, port.platform),
        actionLabel: itemLabels.action,
        onPress,
        destructive: id === "resetApp",
      },
    ];
  };

  const groups = getHelpGroups(port.platform).map(group => ({
    id: group.id,
    title: labels.groups[group.id],
    rows: group.items.flatMap(toRows),
  }));

  return {
    title: labels.title,
    groups,
    confirmation: {
      isOpen: confirmation.isOpen,
      tone: getHelpConfirmationTone(confirmation.id, port.platform),
      labels: labels.confirmations[confirmation.id] ?? labels.confirmations.clearCache,
      isConfirming,
      onConfirm: () => {
        if (confirmation.isOpen) void confirm(confirmation.id);
      },
      onCancel: closeConfirmation,
      testID: "settings-help-confirm",
      confirmTestID: "settings-help-confirm-button",
      cancelTestID: "settings-help-cancel-button",
    },
    screen: HELP_SCREENS[port.platform],
    confirmationScreenName: confirmation.isOpen
      ? getHelpConfirmationScreen(confirmation.id, port.platform)
      : null,
  };
}

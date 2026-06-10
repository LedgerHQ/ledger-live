import type { NotificationPromptTarget } from "../types";

const TRANSACTIONS_ALERTS_PROMPT_TARGET = "transactionsAlertsCategory" as const;

export type NotificationsPromptCopy = {
  titleKey: string;
  descriptionKey: string;
  allowKey: string;
  laterKey: string;
};

export const isTransactionsAlertsPromptTarget = (
  promptTarget: NotificationPromptTarget | undefined,
): promptTarget is typeof TRANSACTIONS_ALERTS_PROMPT_TARGET =>
  promptTarget === TRANSACTIONS_ALERTS_PROMPT_TARGET;

export const getNotificationsPromptCopy = (
  promptTarget: NotificationPromptTarget | undefined,
  isVariantB: boolean,
): NotificationsPromptCopy => {
  if (isTransactionsAlertsPromptTarget(promptTarget)) {
    return {
      titleKey: "notifications.prompt.transactionsAlerts.title",
      descriptionKey: "notifications.prompt.transactionsAlerts.desc",
      allowKey: "notifications.prompt.allow",
      laterKey: "notifications.prompt.later",
    };
  }

  return {
    titleKey: isVariantB ? "notifications.prompt.titleVariantB" : "notifications.prompt.title",
    descriptionKey: isVariantB ? "notifications.prompt.descVariantB" : "notifications.prompt.desc",
    allowKey: "notifications.prompt.allow",
    laterKey: "notifications.prompt.later",
  };
};

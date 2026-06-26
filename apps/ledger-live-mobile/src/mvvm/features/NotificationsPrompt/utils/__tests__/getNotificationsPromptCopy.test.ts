import {
  getNotificationsPromptCopy,
  isTransactionsAlertsPromptTarget,
} from "../getNotificationsPromptCopy";

describe("getNotificationsPromptCopy", () => {
  it.each([undefined, "globalPushNotifications" as const])(
    "returns the global push copy for prompt target %s",
    promptTarget => {
      expect(getNotificationsPromptCopy(promptTarget)).toEqual({
        titleKey: "notifications.prompt.title",
        descriptionKey: "notifications.prompt.desc",
        allowKey: "notifications.prompt.allow",
        laterKey: "notifications.prompt.later",
      });
    },
  );

  it("returns transactions alerts copy for the category prompt target", () => {
    expect(getNotificationsPromptCopy("transactionsAlertsCategory")).toEqual({
      titleKey: "notifications.prompt.transactionsAlerts.title",
      descriptionKey: "notifications.prompt.transactionsAlerts.desc",
      allowKey: "notifications.prompt.allow",
      laterKey: "notifications.prompt.later",
    });
  });

  it("identifies the transactions alerts prompt target", () => {
    expect(isTransactionsAlertsPromptTarget("transactionsAlertsCategory")).toBe(true);
    expect(isTransactionsAlertsPromptTarget("globalPushNotifications")).toBe(false);
    expect(isTransactionsAlertsPromptTarget(undefined)).toBe(false);
  });
});

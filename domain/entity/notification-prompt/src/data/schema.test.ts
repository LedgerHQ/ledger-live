import {
  NotificationPermissionStatusSchema,
  NotificationPromptHistorySchema,
  NotificationPromptPolicySchema,
} from "./schema";
import { mockNotificationPromptHistory, mockNotificationPromptPolicy } from "./schema.mock";

describe("NotificationPromptHistorySchema", () => {
  it("parses a valid notification prompt history from mock factory", () => {
    const history = mockNotificationPromptHistory({
      dismissedPromptAtListByTarget: {
        globalPushNotifications: [1],
        transactionsAlertsCategory: [2],
      },
      lastActionAt: 3,
    });

    expect(NotificationPromptHistorySchema.parse(history)).toEqual(history);
  });

  it("rejects unknown prompt targets", () => {
    expect(() =>
      NotificationPromptHistorySchema.parse({
        dismissedPromptAtListByTarget: {
          unknownTarget: [1],
        },
      }),
    ).toThrow();
  });
});

describe("NotificationPromptPolicySchema", () => {
  it("parses a normalized notification prompt policy", () => {
    const policy = mockNotificationPromptPolicy();

    expect(NotificationPromptPolicySchema.parse(policy)).toEqual(policy);
  });

  it("rejects negative reprompt duration fields", () => {
    expect(() =>
      NotificationPromptPolicySchema.parse(
        mockNotificationPromptPolicy({
          repromptSchedule: [{ days: -1 }],
        }),
      ),
    ).toThrow();
  });
});

describe("NotificationPermissionStatusSchema", () => {
  it("keeps platform permission values out of the domain contract", () => {
    expect(NotificationPermissionStatusSchema.parse("authorized")).toBe("authorized");
    expect(() => NotificationPermissionStatusSchema.parse(1)).toThrow();
  });
});

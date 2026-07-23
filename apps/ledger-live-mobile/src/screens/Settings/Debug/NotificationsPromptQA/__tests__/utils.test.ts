import { add, sub } from "date-fns";
import {
  buildInactiveUserData,
  buildRepromptableUserData,
  buildTruncatedDismissalsUserData,
  formatDismissalTimestamp,
  getAfterActionRepromptLabel,
  getGlobalPushNotificationsDismissals,
  getInactivityRepromptLabel,
} from "../utils";

describe("NotificationsPromptQA utils", () => {
  const now = new Date("2026-01-10T12:00:00.000Z").getTime();
  const repromptSchedule = [{ days: 7, hours: 0, minutes: 0, months: 0, seconds: 0 }];

  it("should format reprompt timing as in X days", () => {
    expect(
      getInactivityRepromptLabel({
        lastActionAt: now,
        inactivityReprompt: { months: 0, days: 3, hours: 0, minutes: 0, seconds: 0 },
        inactivityEnabled: true,
        now,
      }),
    ).toBe("in 3 days");
    expect(
      getInactivityRepromptLabel({
        lastActionAt: now,
        inactivityReprompt: { months: 0, days: 1, hours: 0, minutes: 0, seconds: 0 },
        inactivityEnabled: true,
        now,
      }),
    ).toBe("in 1 day");
    expect(
      getInactivityRepromptLabel({
        lastActionAt: now - 1,
        inactivityReprompt: { months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 },
        inactivityEnabled: true,
        now,
      }),
    ).toBe("now (eligible)");
  });

  it("should use elapsed time instead of calendar-day boundaries for reprompt labels", () => {
    const evening = new Date("2026-01-10T23:30:00.000Z").getTime();
    const shortlyAfterMidnight = new Date("2026-01-11T00:15:00.000Z").getTime();

    expect(
      getAfterActionRepromptLabel({
        dismissedOptInDrawerAtList: [evening],
        repromptSchedule: [{ months: 0, days: 0, hours: 0, minutes: 30, seconds: 0 }],
        now: evening,
      }),
    ).toBe("in less than 1 day");
    expect(
      getInactivityRepromptLabel({
        lastActionAt: evening,
        inactivityReprompt: { months: 0, days: 0, hours: 0, minutes: 30, seconds: 0 },
        inactivityEnabled: true,
        now: evening,
      }),
    ).toBe("in less than 1 day");
    expect(
      getAfterActionRepromptLabel({
        dismissedOptInDrawerAtList: [evening],
        repromptSchedule: [{ months: 0, days: 0, hours: 0, minutes: 30, seconds: 0 }],
        now: shortlyAfterMidnight,
      }),
    ).toBe("now (eligible)");
  });

  it("should format invalid dismissal timestamps without throwing", () => {
    expect(formatDismissalTimestamp(Number.NaN)).toEqual({
      epochMs: "NaN",
      iso: "invalid",
      local: "invalid",
    });
  });

  it("should compute after-action reprompt from the latest dismissal", () => {
    const dismissedOptInDrawerAtList = [add(now, { days: -10 }).getTime()];

    expect(
      getAfterActionRepromptLabel({
        dismissedOptInDrawerAtList,
        repromptSchedule,
        now,
      }),
    ).toBe("now (eligible)");
  });

  it("should use the latest dismissal when multiple dismissals exist", () => {
    const dismissedOptInDrawerAtList = [
      add(now, { days: -30 }).getTime(),
      add(now, { days: -3 }).getTime(),
    ];

    expect(
      getAfterActionRepromptLabel({
        dismissedOptInDrawerAtList,
        repromptSchedule,
        now,
      }),
    ).toBe("in 4 days");
  });

  it("should compute inactivity reprompt from lastActionAt", () => {
    expect(
      getInactivityRepromptLabel({
        lastActionAt: add(now, { days: -1 }).getTime(),
        inactivityReprompt: { months: 0, days: 2, hours: 0, minutes: 0, seconds: 0 },
        inactivityEnabled: true,
        now,
      }),
    ).toBe("in 1 day");
  });

  it("should prefer globalPushNotifications dismissals over the legacy field", () => {
    const migratedDismissals = [add(now, { days: -3 }).getTime()];
    const legacyDismissals = [add(now, { days: -30 }).getTime()];
    const userData = {
      dismissedOptInDrawerAtList: legacyDismissals,
      dismissedPromptAtListByTarget: { globalPushNotifications: migratedDismissals },
    };

    expect(getGlobalPushNotificationsDismissals(userData)).toEqual(migratedDismissals);
    expect(
      getAfterActionRepromptLabel({
        dismissedOptInDrawerAtList: getGlobalPushNotificationsDismissals(userData),
        repromptSchedule,
        now,
      }),
    ).toBe("in 4 days");
  });

  it("should build reprompt-eligible user data when dismissal history exists", () => {
    const result = buildRepromptableUserData(
      {
        dismissedOptInDrawerAtList: [add(now, { days: -1 }).getTime()],
      },
      repromptSchedule,
      now,
    );

    const dismissedList = result.dismissedOptInDrawerAtList;
    expect(dismissedList).toBeDefined();
    const lastDismissedAt = dismissedList!.at(-1);
    expect(lastDismissedAt).toBeDefined();
    expect(lastDismissedAt).toBeLessThan(now);
    expect(add(lastDismissedAt as number, repromptSchedule[0]).getTime()).toBeLessThanOrEqual(now);
    expect(
      getAfterActionRepromptLabel({
        dismissedOptInDrawerAtList: result.dismissedOptInDrawerAtList,
        repromptSchedule,
        now,
      }),
    ).toBe("now (eligible)");
  });

  it("should build reprompt-eligible user data when dismissal history is empty", () => {
    const result = buildRepromptableUserData(undefined, repromptSchedule, now);

    const dismissedList = result.dismissedOptInDrawerAtList;
    expect(dismissedList).toHaveLength(1);
    const lastDismissedAt = dismissedList!.at(-1);
    expect(lastDismissedAt).toBe(sub(now, repromptSchedule[0]).getTime());
    expect(add(lastDismissedAt as number, repromptSchedule[0]).getTime()).toBeLessThanOrEqual(now);
    expect(
      getAfterActionRepromptLabel({
        dismissedOptInDrawerAtList: result.dismissedOptInDrawerAtList,
        repromptSchedule,
        now,
      }),
    ).toBe("now (eligible)");
  });

  it("should use the matching schedule delay when multiple dismissals exist", () => {
    const repromptDelays = [
      { months: 0, days: 7, hours: 0, minutes: 0, seconds: 0 },
      { months: 0, days: 14, hours: 0, minutes: 0, seconds: 0 },
    ];
    const result = buildRepromptableUserData(
      {
        dismissedOptInDrawerAtList: [
          add(now, { days: -30 }).getTime(),
          add(now, { days: -1 }).getTime(),
        ],
      },
      repromptDelays,
      now,
    );

    const lastDismissedAt = result.dismissedOptInDrawerAtList!.at(-1);
    expect(lastDismissedAt).toBe(sub(now, repromptDelays[1]).getTime());
    expect(add(lastDismissedAt as number, repromptDelays[1]).getTime()).toBeLessThanOrEqual(now);
  });

  it("should build reprompt-eligible user data from globalPushNotifications dismissals", () => {
    const result = buildRepromptableUserData(
      {
        dismissedPromptAtListByTarget: {
          globalPushNotifications: [add(now, { days: -1 }).getTime()],
        },
      },
      repromptSchedule,
      now,
    );

    expect(result.dismissedPromptAtListByTarget?.globalPushNotifications).toHaveLength(1);
    expect(
      getAfterActionRepromptLabel({
        dismissedOptInDrawerAtList: getGlobalPushNotificationsDismissals(result),
        repromptSchedule,
        now,
      }),
    ).toBe("now (eligible)");
  });

  describe("buildTruncatedDismissalsUserData", () => {
    it("should truncate globalPushNotifications dismissals when legacy field is empty", () => {
      const dismissals = [
        add(now, { days: -30 }).getTime(),
        add(now, { days: -20 }).getTime(),
        add(now, { days: -10 }).getTime(),
      ];
      const result = buildTruncatedDismissalsUserData(
        {
          dismissedPromptAtListByTarget: {
            globalPushNotifications: dismissals,
          },
        },
        2,
      );

      expect(getGlobalPushNotificationsDismissals(result)).toEqual(dismissals.slice(0, 2));
      expect(result.dismissedOptInDrawerAtList).toEqual(dismissals.slice(0, 2));
      expect(result.dismissedPromptAtListByTarget?.globalPushNotifications).toEqual(
        dismissals.slice(0, 2),
      );
    });

    it("should truncate legacy dismissedOptInDrawerAtList dismissals", () => {
      const dismissals = [
        add(now, { days: -30 }).getTime(),
        add(now, { days: -20 }).getTime(),
        add(now, { days: -10 }).getTime(),
      ];
      const result = buildTruncatedDismissalsUserData(
        { dismissedOptInDrawerAtList: dismissals },
        2,
      );

      expect(result.dismissedOptInDrawerAtList).toEqual(dismissals.slice(0, 2));
      expect(result.dismissedPromptAtListByTarget?.globalPushNotifications).toEqual(
        result.dismissedOptInDrawerAtList,
      );
    });

    it("should prefer globalPushNotifications when legacy field is stale", () => {
      const migratedDismissals = [
        add(now, { days: -30 }).getTime(),
        add(now, { days: -20 }).getTime(),
        add(now, { days: -10 }).getTime(),
      ];
      const legacyDismissals = [add(now, { days: -1 }).getTime()];

      const result = buildTruncatedDismissalsUserData(
        {
          dismissedOptInDrawerAtList: legacyDismissals,
          dismissedPromptAtListByTarget: { globalPushNotifications: migratedDismissals },
        },
        2,
      );

      expect(result.dismissedOptInDrawerAtList).toEqual(migratedDismissals.slice(0, 2));
      expect(result.dismissedPromptAtListByTarget?.globalPushNotifications).toEqual(
        migratedDismissals.slice(0, 2),
      );
    });

    it("should return empty dismissals when input has no dismissal history", () => {
      const result = buildTruncatedDismissalsUserData(undefined, 2);

      expect(result.dismissedOptInDrawerAtList).toEqual([]);
      expect(result.dismissedPromptAtListByTarget?.globalPushNotifications).toEqual([]);
    });

    it("should keep the full list when keepCount exceeds dismissal count", () => {
      const dismissals = [add(now, { days: -10 }).getTime()];
      const result = buildTruncatedDismissalsUserData(
        { dismissedOptInDrawerAtList: dismissals },
        5,
      );

      expect(result.dismissedOptInDrawerAtList).toEqual(dismissals);
      expect(result.dismissedPromptAtListByTarget?.globalPushNotifications).toEqual(dismissals);
    });

    it("should treat negative keepCount as zero", () => {
      const dismissals = [add(now, { days: -10 }).getTime(), add(now, { days: -5 }).getTime()];
      const result = buildTruncatedDismissalsUserData(
        { dismissedOptInDrawerAtList: dismissals },
        -1,
      );

      expect(result.dismissedOptInDrawerAtList).toEqual([]);
      expect(result.dismissedPromptAtListByTarget?.globalPushNotifications).toEqual([]);
    });
  });

  it("should build inactive user data that satisfies checkIsInactive", () => {
    const inactivityReprompt = { months: 0, days: 2, hours: 0, minutes: 0, seconds: 0 };
    const result = buildInactiveUserData(undefined, inactivityReprompt, now);

    expect(result.lastActionAt).toBe(sub(now, inactivityReprompt).getTime());
    expect(add(result.lastActionAt as number, inactivityReprompt).getTime()).toBeLessThanOrEqual(
      now,
    );
    expect(
      getInactivityRepromptLabel({
        lastActionAt: result.lastActionAt,
        inactivityReprompt,
        inactivityEnabled: true,
        now,
      }),
    ).toBe("now (eligible)");
  });
});

import {
  ALL_NOTIFICATIONS_ON,
  createNotificationsValues,
} from "../__tests__/fakeNotificationsPort";
import {
  getNotificationsRows,
  isNotificationsRowShown,
  shouldShowOsPermissionBanner,
} from "./notificationsRows";

const rowKeys = (values = createNotificationsValues()) =>
  getNotificationsRows(values).map(row => row.key);

describe("getNotificationsRows", () => {
  it("lists Allow notifications then the categories in the order of the design", () => {
    expect(rowKeys()).toEqual([
      "areNotificationsAllowed",
      "announcementsCategory",
      "totalMarketCap",
      "largeMoverCategory",
      "topGainersLosers",
      "transactionsAlertsCategory",
    ]);
  });

  it("gives each row its stored value", () => {
    const rows = getNotificationsRows(
      createNotificationsValues({
        notifications: { ...ALL_NOTIFICATIONS_ON, largeMoverCategory: false },
      }),
    );

    expect(rows.find(row => row.key === "largeMoverCategory")?.value).toBe(false);
    expect(rows.find(row => row.key === "announcementsCategory")?.value).toBe(true);
  });

  it("hides the categories hidden remotely", () => {
    expect(
      rowKeys(
        createNotificationsValues({
          hiddenCategories: ["announcementsCategory", "totalMarketCap"],
        }),
      ),
    ).toEqual([
      "areNotificationsAllowed",
      "largeMoverCategory",
      "topGainersLosers",
      "transactionsAlertsCategory",
    ]);
  });

  it("enables every toggle while the phone allows notifications and Allow is on", () => {
    expect(getNotificationsRows(createNotificationsValues()).every(row => !row.disabled)).toBe(
      true,
    );
  });

  it("disables the categories but not Allow notifications while Allow is off", () => {
    const rows = getNotificationsRows(
      createNotificationsValues({
        notifications: { ...ALL_NOTIFICATIONS_ON, areNotificationsAllowed: false },
      }),
    );

    expect(rows.filter(row => row.disabled).map(row => row.key)).toEqual([
      "announcementsCategory",
      "totalMarketCap",
      "largeMoverCategory",
      "topGainersLosers",
      "transactionsAlertsCategory",
    ]);
  });

  it("disables every toggle while the phone blocks notifications", () => {
    const rows = getNotificationsRows(createNotificationsValues({ osPermissionAuthorized: false }));

    expect(rows.every(row => row.disabled)).toBe(true);
  });
});

describe("isNotificationsRowShown", () => {
  it("always shows Allow notifications, even when the remote config lists it", () => {
    expect(
      isNotificationsRowShown("areNotificationsAllowed", {
        hiddenCategories: ["areNotificationsAllowed"],
        transactionsAlertsEnabled: false,
      }),
    ).toBe(true);
  });

  it("hides Transaction alerts only while the transactionsAlerts feature is on", () => {
    const hiddenCategories = ["transactionsAlertsCategory"];

    expect(
      isNotificationsRowShown("transactionsAlertsCategory", {
        hiddenCategories,
        transactionsAlertsEnabled: true,
      }),
    ).toBe(false);
    expect(
      isNotificationsRowShown("transactionsAlertsCategory", {
        hiddenCategories,
        transactionsAlertsEnabled: false,
      }),
    ).toBe(true);
  });
});

describe("shouldShowOsPermissionBanner", () => {
  it("shows the banner only while the phone blocks notifications", () => {
    expect(shouldShowOsPermissionBanner({ osPermissionAuthorized: false })).toBe(true);
    expect(shouldShowOsPermissionBanner({ osPermissionAuthorized: true })).toBe(false);
  });
});

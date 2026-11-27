import { ALL_NOTIFICATIONS_ON } from "../__tests__/fakeNotificationsPort";
import type { NotificationsSideEffects } from "../ports";
import { applyNotificationUpdate } from "./notificationUpdate";

function createSideEffects() {
  const calls: string[] = [];
  const sideEffects: NotificationsSideEffects = {
    setNotifications: jest.fn(() => calls.push("setNotifications")),
    markUserAsOptIn: jest.fn(() => calls.push("markUserAsOptIn")),
    markUserAsOptOut: jest.fn(() => calls.push("markUserAsOptOut")),
    updateIdentify: jest.fn(() => calls.push("updateIdentify")),
    updateUserPreferences: jest.fn(() => calls.push("updateUserPreferences")),
  };
  return { sideEffects, calls };
}

const authorized = { notifications: ALL_NOTIFICATIONS_ON, osPermissionAuthorized: true };

describe("applyNotificationUpdate", () => {
  it("stores a category change, identifies and sends the new preferences, in the legacy order", () => {
    const { sideEffects, calls } = createSideEffects();

    applyNotificationUpdate({ key: "largeMoverCategory", value: false }, authorized, sideEffects);

    expect(sideEffects.setNotifications).toHaveBeenCalledWith({ largeMoverCategory: false });
    expect(sideEffects.updateUserPreferences).toHaveBeenCalledWith({
      ...ALL_NOTIFICATIONS_ON,
      largeMoverCategory: false,
    });
    expect(calls).toEqual(["setNotifications", "updateIdentify", "updateUserPreferences"]);
  });

  it("marks the user as opted out when Allow notifications is turned off", () => {
    const { sideEffects, calls } = createSideEffects();

    applyNotificationUpdate(
      { key: "areNotificationsAllowed", value: false },
      authorized,
      sideEffects,
    );

    expect(calls).toEqual([
      "setNotifications",
      "markUserAsOptOut",
      "updateIdentify",
      "updateUserPreferences",
    ]);
  });

  it("marks the user as opted in when Allow notifications is turned on and the phone allows it", () => {
    const { sideEffects } = createSideEffects();

    applyNotificationUpdate(
      { key: "areNotificationsAllowed", value: true },
      authorized,
      sideEffects,
    );

    expect(sideEffects.markUserAsOptIn).toHaveBeenCalledTimes(1);
    expect(sideEffects.markUserAsOptOut).not.toHaveBeenCalled();
  });

  it("does not mark the user as opted in while the phone blocks notifications", () => {
    const { sideEffects } = createSideEffects();

    applyNotificationUpdate(
      { key: "areNotificationsAllowed", value: true },
      { ...authorized, osPermissionAuthorized: false },
      sideEffects,
    );

    expect(sideEffects.markUserAsOptIn).not.toHaveBeenCalled();
    expect(sideEffects.markUserAsOptOut).not.toHaveBeenCalled();
  });

  it("does not change the opt-in state for a category", () => {
    const { sideEffects } = createSideEffects();

    applyNotificationUpdate({ key: "announcementsCategory", value: true }, authorized, sideEffects);

    expect(sideEffects.markUserAsOptIn).not.toHaveBeenCalled();
    expect(sideEffects.markUserAsOptOut).not.toHaveBeenCalled();
  });
});

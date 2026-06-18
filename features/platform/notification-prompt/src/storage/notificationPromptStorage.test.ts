import { getPushNotificationsDataOfUserFromStorage } from "./notificationPromptStorage";

describe("getPushNotificationsDataOfUserFromStorage", () => {
  it("backfills and persists legacy dismissals before returning stored user data", async () => {
    const legacyDismissals = [100, 200];
    const save = jest.fn();
    const storage = {
      get: jest.fn().mockResolvedValue({
        dismissedOptInDrawerAtList: legacyDismissals,
      }),
      save,
    };

    await expect(getPushNotificationsDataOfUserFromStorage(storage)).resolves.toEqual({
      dismissedOptInDrawerAtList: legacyDismissals,
      dismissedPromptAtListByTarget: { globalPushNotifications: legacyDismissals },
    });

    expect(save).toHaveBeenCalledWith("pushNotificationsDataOfUser", {
      dismissedOptInDrawerAtList: legacyDismissals,
      dismissedPromptAtListByTarget: { globalPushNotifications: legacyDismissals },
    });
  });

  it("does not persist when globalPushNotifications is already defined", async () => {
    const history = {
      dismissedOptInDrawerAtList: [100],
      dismissedPromptAtListByTarget: { globalPushNotifications: [100] },
    };
    const storage = {
      get: jest.fn().mockResolvedValue(history),
      save: jest.fn(),
    };

    await expect(getPushNotificationsDataOfUserFromStorage(storage)).resolves.toEqual(history);
    expect(storage.save).not.toHaveBeenCalled();
  });
});

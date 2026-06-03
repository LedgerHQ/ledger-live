import storage from "LLM/storage";
import { getPushNotificationsDataOfUserFromStorage } from "../storage";

describe("getPushNotificationsDataOfUserFromStorage", () => {
  beforeEach(async () => {
    await storage.deleteAll();
  });

  it("should backfill and persist legacy dismissals before returning stored user data", async () => {
    const legacyDismissals = [100, 200];
    await storage.save("pushNotificationsDataOfUser", {
      dismissedOptInDrawerAtList: legacyDismissals,
    });

    await expect(getPushNotificationsDataOfUserFromStorage()).resolves.toEqual({
      dismissedOptInDrawerAtList: legacyDismissals,
      dismissedPromptAtListByTarget: { globalPushNotifications: legacyDismissals },
    });

    await expect(storage.get("pushNotificationsDataOfUser")).resolves.toEqual({
      dismissedOptInDrawerAtList: legacyDismissals,
      dismissedPromptAtListByTarget: { globalPushNotifications: legacyDismissals },
    });
  });

  it("should not persist when globalPushNotifications is already defined", async () => {
    const dataOfUser = {
      dismissedOptInDrawerAtList: [100],
      dismissedPromptAtListByTarget: { globalPushNotifications: [100] },
    };
    await storage.save("pushNotificationsDataOfUser", dataOfUser);

    const saveSpy = jest.spyOn(storage, "save");

    await expect(getPushNotificationsDataOfUserFromStorage()).resolves.toEqual(dataOfUser);
    expect(saveSpy).not.toHaveBeenCalled();

    saveSpy.mockRestore();
  });
});

import {
  setNotificationsDrawerPromptTarget,
  setNotificationsDrawerSource,
  setNotificationsModalOpen,
} from "~/actions/notifications";
import { handleNotificationsOptInDeeplink } from "../handleNotificationsOptInDeeplink";

describe("handleNotificationsOptInDeeplink", () => {
  it("should open the opt-in drawer for global push notifications with the deeplink source", () => {
    const dispatch = jest.fn();

    handleNotificationsOptInDeeplink({
      isPushNotificationsEnabled: true,
      hasCompletedOnboarding: true,
      dispatch,
      config: undefined,
    });

    expect(dispatch).toHaveBeenCalledWith(setNotificationsDrawerSource("deeplink"));
    expect(dispatch).toHaveBeenCalledWith(
      setNotificationsDrawerPromptTarget("globalPushNotifications"),
    );
    expect(dispatch).toHaveBeenCalledWith(setNotificationsModalOpen(true));
  });

  it("should ignore the deeplink when push notifications are disabled", () => {
    const dispatch = jest.fn();

    const result = handleNotificationsOptInDeeplink({
      isPushNotificationsEnabled: false,
      hasCompletedOnboarding: true,
      dispatch,
      config: undefined,
    });

    expect(result).toBeUndefined();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("should ignore the deeplink before onboarding is completed", () => {
    const dispatch = jest.fn();

    const result = handleNotificationsOptInDeeplink({
      isPushNotificationsEnabled: true,
      hasCompletedOnboarding: false,
      dispatch,
      config: undefined,
    });

    expect(result).toBeUndefined();
    expect(dispatch).not.toHaveBeenCalled();
  });
});

import { act } from "@testing-library/react-native";
import { Linking, PermissionsAndroid, Platform } from "react-native";
import { AuthorizationStatus, getMessaging } from "@react-native-firebase/messaging";
import { renderHook } from "@tests/test-renderer";
import { State } from "~/reducers/types";
import { useNotificationsPermission } from "LLM/hooks/useNotificationsPermission";

jest.mock("~/analytics", () => ({ updateIdentify: jest.fn() }));

type PermissionStatus = (typeof AuthorizationStatus)[keyof typeof AuthorizationStatus];

const withPermissionStatus =
  (permissionStatus: PermissionStatus | undefined) => (state: State) => ({
    ...state,
    notifications: { ...state.notifications, permissionStatus },
  });

const renderWithPermissionStatus = (permissionStatus: PermissionStatus | undefined) =>
  renderHook(() => useNotificationsPermission(), {
    overrideInitialState: withPermissionStatus(permissionStatus),
  });

describe("useNotificationsPermission", () => {
  let requestAndroidPermission: jest.SpyInstance;
  let openSettings: jest.SpyInstance;
  let platformVersion: jest.SpyInstance | undefined;
  const requestFirebasePermission = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    requestAndroidPermission = jest.spyOn(PermissionsAndroid, "request");
    openSettings = jest.spyOn(Linking, "openSettings").mockResolvedValue(undefined);
    jest.mocked(getMessaging).mockReturnValue({
      requestPermission: requestFirebasePermission,
    } as unknown as ReturnType<typeof getMessaging>);
  });

  afterEach(() => {
    requestAndroidPermission.mockRestore();
    openSettings.mockRestore();
    platformVersion?.mockRestore();
    platformVersion = undefined;
  });

  describe("on Android 13 and above", () => {
    beforeEach(() => {
      jest.replaceProperty(Platform, "OS", "android");
      platformVersion = jest.spyOn(Platform, "Version", "get").mockReturnValue(33);
    });

    it("should request POST_NOTIFICATIONS when the OS reports notifications as denied", async () => {
      requestAndroidPermission.mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
      const { result } = renderWithPermissionStatus(AuthorizationStatus.DENIED);

      await act(() => result.current.requestPushNotificationsPermission());

      expect(requestAndroidPermission).toHaveBeenCalledWith(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      expect(requestFirebasePermission).not.toHaveBeenCalled();
      expect(openSettings).not.toHaveBeenCalled();
    });

    it("should store AUTHORIZED when the user grants the permission", async () => {
      requestAndroidPermission.mockResolvedValue(PermissionsAndroid.RESULTS.GRANTED);
      const { result, store } = renderWithPermissionStatus(AuthorizationStatus.DENIED);

      let permission;
      await act(async () => {
        permission = await result.current.requestPushNotificationsPermission();
      });

      expect(permission).toBe(AuthorizationStatus.AUTHORIZED);
      expect(store.getState().notifications.permissionStatus).toBe(AuthorizationStatus.AUTHORIZED);
    });

    it("should return DENIED when the user declines the permission", async () => {
      requestAndroidPermission.mockResolvedValue(PermissionsAndroid.RESULTS.DENIED);
      const { result } = renderWithPermissionStatus(undefined);

      let permission;
      await act(async () => {
        permission = await result.current.requestPushNotificationsPermission();
      });

      expect(permission).toBe(AuthorizationStatus.DENIED);
      expect(openSettings).not.toHaveBeenCalled();
    });

    it("should open the settings when the permission can no longer be requested", async () => {
      requestAndroidPermission.mockResolvedValue(PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN);
      const { result } = renderWithPermissionStatus(AuthorizationStatus.DENIED);

      await act(() => result.current.requestPushNotificationsPermission());

      expect(openSettings).toHaveBeenCalledTimes(1);
    });

    it("should not request the permission when it is already authorized", async () => {
      const { result } = renderWithPermissionStatus(AuthorizationStatus.AUTHORIZED);

      await act(() => result.current.requestPushNotificationsPermission());

      expect(requestAndroidPermission).not.toHaveBeenCalled();
    });
  });

  describe("on Android 12 and below", () => {
    beforeEach(() => {
      jest.replaceProperty(Platform, "OS", "android");
      platformVersion = jest.spyOn(Platform, "Version", "get").mockReturnValue(32);
    });

    it("should open the settings without requesting POST_NOTIFICATIONS when denied", async () => {
      const { result } = renderWithPermissionStatus(AuthorizationStatus.DENIED);

      await act(() => result.current.requestPushNotificationsPermission());

      expect(requestAndroidPermission).not.toHaveBeenCalled();
      expect(openSettings).toHaveBeenCalledTimes(1);
    });
  });

  describe("on iOS", () => {
    beforeEach(() => {
      jest.replaceProperty(Platform, "OS", "ios");
    });

    it("should request the permission through Firebase when not determined", async () => {
      requestFirebasePermission.mockResolvedValue(AuthorizationStatus.AUTHORIZED);
      const { result } = renderWithPermissionStatus(AuthorizationStatus.NOT_DETERMINED);

      await act(() => result.current.requestPushNotificationsPermission());

      expect(requestFirebasePermission).toHaveBeenCalledTimes(1);
      expect(requestAndroidPermission).not.toHaveBeenCalled();
    });
  });
});

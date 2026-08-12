import React from "react";
import { render } from "@testing-library/react-native";
import { UserId, DUMMY_USER_ID, userIdSelector } from "@domain/entity-client-identity";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "~/context/hooks";
import { notificationsSelector, trackingEnabledSelector } from "../reducers/settings";
import HookNotifications from "./HookNotifications";
import { start, updateUserPreferences } from "./braze";
import type { NotificationsSettings } from "../reducers/types";

jest.mock("./braze", () => ({
  start: jest.fn(),
  updateUserPreferences: jest.fn(),
}));

jest.mock("@features/platform-feature-flags", () => ({
  useFeature: jest.fn(),
}));

jest.mock("~/context/hooks", () => ({
  useSelector: jest.fn(),
}));

const mockedStart = jest.mocked(start);
const mockedUpdateUserPreferences = jest.mocked(updateUserPreferences);
const mockedUseFeature = jest.mocked(useFeature);
const mockedUseSelector = jest.mocked(useSelector);

const REAL_USER_ID = UserId.fromString("11111111-1111-1111-1111-111111111111");

const defaultNotifications = {
  areNotificationsAllowed: true,
  announcementsCategory: true,
  largeMoverCategory: true,
  transactionsAlertsCategory: true,
  totalMarketCap: true,
  topGainersLosers: true,
} satisfies NotificationsSettings;

const mockSelectors = ({
  isTrackedUser,
  userId,
  notifications = defaultNotifications,
}: {
  isTrackedUser: boolean;
  userId: UserId;
  notifications?: NotificationsSettings;
}) => {
  mockedUseSelector.mockImplementation(selector => {
    if (selector === trackingEnabledSelector) return isTrackedUser;
    if (selector === userIdSelector) return userId;
    if (selector === notificationsSelector) return notifications;
    throw new Error("Unexpected selector");
  });
};

describe("HookNotifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseFeature.mockReturnValue({ enabled: true } as ReturnType<typeof useFeature>);
  });

  it("should sync Braze identity once for unchanged consent and user id", () => {
    mockSelectors({ isTrackedUser: true, userId: REAL_USER_ID });

    const { rerender } = render(<HookNotifications />);
    rerender(<HookNotifications />);

    expect(mockedStart).toHaveBeenCalledTimes(1);
    expect(mockedStart).toHaveBeenCalledWith(true, REAL_USER_ID, {
      brazeOptOutIdentityCleanup: true,
    });
  });

  it("should re-sync Braze identity when consent changes from opt-in to opt-out", () => {
    mockSelectors({ isTrackedUser: true, userId: REAL_USER_ID });
    const { rerender } = render(<HookNotifications />);

    mockSelectors({ isTrackedUser: false, userId: REAL_USER_ID });
    rerender(<HookNotifications />);

    expect(mockedStart).toHaveBeenCalledTimes(2);
    expect(mockedStart).toHaveBeenLastCalledWith(false, REAL_USER_ID, {
      brazeOptOutIdentityCleanup: true,
    });
  });

  it("should re-sync Braze identity when consent changes from opt-out to opt-in", () => {
    mockSelectors({ isTrackedUser: false, userId: REAL_USER_ID });
    const { rerender } = render(<HookNotifications />);

    mockSelectors({ isTrackedUser: true, userId: REAL_USER_ID });
    rerender(<HookNotifications />);

    expect(mockedStart).toHaveBeenCalledTimes(2);
    expect(mockedStart).toHaveBeenLastCalledWith(true, REAL_USER_ID, {
      brazeOptOutIdentityCleanup: true,
    });
  });

  it("should retry Braze identity sync when dummy user id becomes real", () => {
    mockSelectors({ isTrackedUser: true, userId: DUMMY_USER_ID });
    const { rerender } = render(<HookNotifications />);
    expect(mockedStart).not.toHaveBeenCalled();

    mockSelectors({ isTrackedUser: true, userId: REAL_USER_ID });
    rerender(<HookNotifications />);

    expect(mockedStart).toHaveBeenCalledTimes(1);
    expect(mockedStart).toHaveBeenCalledWith(true, REAL_USER_ID, {
      brazeOptOutIdentityCleanup: true,
    });
  });

  it("should re-sync Braze identity when the cleanup feature flag changes", () => {
    mockedUseFeature.mockReturnValue({ enabled: false } as ReturnType<typeof useFeature>);
    mockSelectors({ isTrackedUser: false, userId: REAL_USER_ID });
    const { rerender } = render(<HookNotifications />);
    expect(mockedStart).toHaveBeenCalledTimes(1);
    expect(mockedStart).toHaveBeenLastCalledWith(false, REAL_USER_ID, {
      brazeOptOutIdentityCleanup: false,
    });

    mockedUseFeature.mockReturnValue({ enabled: true } as ReturnType<typeof useFeature>);
    rerender(<HookNotifications />);

    expect(mockedStart).toHaveBeenCalledTimes(2);
    expect(mockedStart).toHaveBeenLastCalledWith(false, REAL_USER_ID, {
      brazeOptOutIdentityCleanup: true,
    });
  });

  it("should update notification preferences when settings change", () => {
    mockSelectors({ isTrackedUser: true, userId: REAL_USER_ID });
    const updatedNotifications = {
      ...defaultNotifications,
      announcementsCategory: false,
    };

    const { rerender } = render(<HookNotifications />);
    mockSelectors({
      isTrackedUser: true,
      userId: REAL_USER_ID,
      notifications: updatedNotifications,
    });
    rerender(<HookNotifications />);

    expect(mockedUpdateUserPreferences).toHaveBeenCalledTimes(2);
    expect(mockedUpdateUserPreferences).toHaveBeenLastCalledWith(updatedNotifications, true);
  });

  it("should pass tracking consent into notification preference updates", () => {
    mockSelectors({ isTrackedUser: false, userId: REAL_USER_ID });
    render(<HookNotifications />);

    expect(mockedUpdateUserPreferences).toHaveBeenCalledWith(defaultNotifications, false);
  });
});

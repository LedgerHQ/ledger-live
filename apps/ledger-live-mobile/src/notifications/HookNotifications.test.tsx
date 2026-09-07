import React from "react";
import { act, render } from "@testing-library/react-native";
import { UserId, DUMMY_USER_ID, userIdSelector } from "@domain/entity-client-identity";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "~/context/hooks";
import { notificationsSelector, trackingEnabledSelector } from "../reducers/settings";
import HookNotifications from "./HookNotifications";
import { applyBrazeConsentTransition, start, updateUserPreferences } from "./braze";
import type { NotificationsSettings } from "../reducers/types";

jest.mock("./braze", () => ({
  applyBrazeConsentTransition: jest.fn().mockResolvedValue(undefined),
  start: jest.fn(),
  updateUserPreferences: jest.fn(),
}));

jest.mock("@features/platform-feature-flags", () => ({
  useFeature: jest.fn(),
}));

jest.mock("~/context/hooks", () => ({
  useSelector: jest.fn(),
}));

const mockedApplyBrazeConsentTransition = jest.mocked(applyBrazeConsentTransition);
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
    mockedApplyBrazeConsentTransition.mockResolvedValue(undefined);
  });

  it("should sync Braze identity once for unchanged consent and user id", () => {
    mockSelectors({ isTrackedUser: true, userId: REAL_USER_ID });

    const { rerender } = render(<HookNotifications />);
    rerender(<HookNotifications />);

    expect(mockedStart).toHaveBeenCalledTimes(1);
    expect(mockedStart).toHaveBeenCalledWith(true, REAL_USER_ID, {
      brazeOptOutIdentityCleanup: true,
    });
    expect(mockedApplyBrazeConsentTransition).not.toHaveBeenCalled();
  });

  it("should run the opt-out lifecycle when consent changes from opt-in to opt-out", () => {
    mockSelectors({ isTrackedUser: true, userId: REAL_USER_ID });
    const { rerender } = render(<HookNotifications />);

    mockSelectors({ isTrackedUser: false, userId: REAL_USER_ID });
    rerender(<HookNotifications />);

    expect(mockedStart).toHaveBeenCalledTimes(1);
    expect(mockedApplyBrazeConsentTransition).toHaveBeenCalledTimes(1);
    expect(mockedApplyBrazeConsentTransition).toHaveBeenCalledWith(
      {
        isTrackedUser: false,
        userId: REAL_USER_ID,
      },
      {
        prepareForIdentityTransition: expect.any(Function),
        refreshContentCards: expect.any(Function),
      },
    );
  });

  it("should run the opt-in lifecycle when consent changes from opt-out to opt-in", () => {
    mockSelectors({ isTrackedUser: false, userId: REAL_USER_ID });
    const { rerender } = render(<HookNotifications />);

    mockSelectors({ isTrackedUser: true, userId: REAL_USER_ID });
    rerender(<HookNotifications />);

    expect(mockedStart).toHaveBeenCalledTimes(1);
    expect(mockedApplyBrazeConsentTransition).toHaveBeenCalledTimes(1);
    expect(mockedApplyBrazeConsentTransition).toHaveBeenCalledWith(
      {
        isTrackedUser: true,
        userId: REAL_USER_ID,
      },
      {
        prepareForIdentityTransition: expect.any(Function),
        refreshContentCards: expect.any(Function),
      },
    );
  });

  it("should re-sync Braze identity with start when the cleanup flag is off and consent changes", () => {
    mockedUseFeature.mockReturnValue({ enabled: false } as ReturnType<typeof useFeature>);
    mockSelectors({ isTrackedUser: true, userId: REAL_USER_ID });
    const { rerender } = render(<HookNotifications />);

    mockSelectors({ isTrackedUser: false, userId: REAL_USER_ID });
    rerender(<HookNotifications />);

    expect(mockedStart).toHaveBeenCalledTimes(2);
    expect(mockedStart).toHaveBeenLastCalledWith(false, REAL_USER_ID, {
      brazeOptOutIdentityCleanup: false,
    });
    expect(mockedApplyBrazeConsentTransition).not.toHaveBeenCalled();
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
    expect(mockedApplyBrazeConsentTransition).not.toHaveBeenCalled();
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
    expect(mockedApplyBrazeConsentTransition).not.toHaveBeenCalled();
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
    expect(mockedUpdateUserPreferences).toHaveBeenLastCalledWith(updatedNotifications, true, {
      brazeOptOutIdentityCleanup: true,
    });
  });

  it("should pass tracking consent into notification preference updates", () => {
    mockSelectors({ isTrackedUser: false, userId: REAL_USER_ID });
    render(<HookNotifications />);

    expect(mockedUpdateUserPreferences).toHaveBeenCalledWith(defaultNotifications, false, {
      brazeOptOutIdentityCleanup: true,
    });
  });

  it("should hold notification preferences back until the opt-in lifecycle completes", async () => {
    let completeTransition: () => void = () => {};
    mockedApplyBrazeConsentTransition.mockReturnValueOnce(
      new Promise<void>(resolve => {
        completeTransition = resolve;
      }),
    );
    mockSelectors({ isTrackedUser: false, userId: REAL_USER_ID });
    const { rerender } = render(<HookNotifications />);
    mockedUpdateUserPreferences.mockClear();

    mockSelectors({ isTrackedUser: true, userId: REAL_USER_ID });
    rerender(<HookNotifications />);

    // Writing here would hit a wiped, still anonymous profile.
    expect(mockedUpdateUserPreferences).not.toHaveBeenCalled();

    await act(async () => {
      completeTransition();
    });

    expect(mockedUpdateUserPreferences).toHaveBeenCalledTimes(1);
    expect(mockedUpdateUserPreferences).toHaveBeenCalledWith(defaultNotifications, true, {
      brazeOptOutIdentityCleanup: true,
    });
  });

  it("should write the latest notification preferences once the opt-in lifecycle completes", async () => {
    let completeTransition: () => void = () => {};
    mockedApplyBrazeConsentTransition.mockReturnValueOnce(
      new Promise<void>(resolve => {
        completeTransition = resolve;
      }),
    );
    const updatedNotifications = { ...defaultNotifications, announcementsCategory: false };
    mockSelectors({ isTrackedUser: false, userId: REAL_USER_ID });
    const { rerender } = render(<HookNotifications />);

    mockSelectors({ isTrackedUser: true, userId: REAL_USER_ID });
    rerender(<HookNotifications />);
    mockedUpdateUserPreferences.mockClear();

    mockSelectors({
      isTrackedUser: true,
      userId: REAL_USER_ID,
      notifications: updatedNotifications,
    });
    rerender(<HookNotifications />);

    await act(async () => {
      completeTransition();
    });

    expect(mockedUpdateUserPreferences).toHaveBeenCalledTimes(1);
    expect(mockedUpdateUserPreferences).toHaveBeenCalledWith(updatedNotifications, true, {
      brazeOptOutIdentityCleanup: true,
    });
  });

  it("should skip notification preferences when the opt-in lifecycle fails", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockedApplyBrazeConsentTransition.mockRejectedValue(new Error("wipe failed"));
    mockSelectors({ isTrackedUser: false, userId: REAL_USER_ID });
    const { rerender } = render(<HookNotifications />);
    mockedUpdateUserPreferences.mockClear();

    try {
      mockSelectors({ isTrackedUser: true, userId: REAL_USER_ID });
      await act(async () => {
        rerender(<HookNotifications />);
      });

      expect(mockedUpdateUserPreferences).not.toHaveBeenCalled();
      expect(mockedApplyBrazeConsentTransition).toHaveBeenCalledTimes(2);
    } finally {
      warnSpy.mockRestore();
    }
  });

  it("should retry a failed consent transition without treating it as synced", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    mockedApplyBrazeConsentTransition
      .mockRejectedValueOnce(new Error("wipe failed"))
      .mockResolvedValueOnce(undefined);
    mockSelectors({ isTrackedUser: false, userId: REAL_USER_ID });
    const { rerender } = render(<HookNotifications />);
    mockedUpdateUserPreferences.mockClear();

    try {
      mockSelectors({ isTrackedUser: true, userId: REAL_USER_ID });
      await act(async () => {
        rerender(<HookNotifications />);
      });

      expect(mockedApplyBrazeConsentTransition).toHaveBeenCalledTimes(2);
      expect(mockedUpdateUserPreferences).toHaveBeenCalledTimes(1);
      expect(mockedUpdateUserPreferences).toHaveBeenCalledWith(defaultNotifications, true, {
        brazeOptOutIdentityCleanup: true,
      });
    } finally {
      warnSpy.mockRestore();
    }
  });

  it("should apply the latest consent when it flips back while opt-out is in flight", async () => {
    let completeFirstTransition: () => void = () => {};
    mockedApplyBrazeConsentTransition.mockImplementationOnce(
      () =>
        new Promise<void>(resolve => {
          completeFirstTransition = resolve;
        }),
    );
    mockSelectors({ isTrackedUser: true, userId: REAL_USER_ID });
    const { rerender } = render(<HookNotifications />);

    mockSelectors({ isTrackedUser: false, userId: REAL_USER_ID });
    rerender(<HookNotifications />);

    expect(mockedApplyBrazeConsentTransition).toHaveBeenCalledTimes(1);
    expect(mockedApplyBrazeConsentTransition).toHaveBeenCalledWith(
      {
        isTrackedUser: false,
        userId: REAL_USER_ID,
      },
      {
        prepareForIdentityTransition: expect.any(Function),
        refreshContentCards: expect.any(Function),
      },
    );

    mockSelectors({ isTrackedUser: true, userId: REAL_USER_ID });
    rerender(<HookNotifications />);
    expect(mockedApplyBrazeConsentTransition).toHaveBeenCalledTimes(1);
    mockedUpdateUserPreferences.mockClear();

    await act(async () => {
      completeFirstTransition();
    });

    expect(mockedApplyBrazeConsentTransition).toHaveBeenCalledTimes(2);
    expect(mockedApplyBrazeConsentTransition).toHaveBeenLastCalledWith(
      {
        isTrackedUser: true,
        userId: REAL_USER_ID,
      },
      {
        prepareForIdentityTransition: expect.any(Function),
        refreshContentCards: expect.any(Function),
      },
    );
    expect(mockedUpdateUserPreferences).toHaveBeenCalledWith(defaultNotifications, true, {
      brazeOptOutIdentityCleanup: true,
    });
  });

  it("should apply the latest consent when it flips back while opt-in is in flight", async () => {
    let completeFirstTransition: () => void = () => {};
    mockedApplyBrazeConsentTransition.mockImplementationOnce(
      () =>
        new Promise<void>(resolve => {
          completeFirstTransition = resolve;
        }),
    );
    mockSelectors({ isTrackedUser: false, userId: REAL_USER_ID });
    const { rerender } = render(<HookNotifications />);

    mockSelectors({ isTrackedUser: true, userId: REAL_USER_ID });
    rerender(<HookNotifications />);

    expect(mockedApplyBrazeConsentTransition).toHaveBeenCalledTimes(1);
    expect(mockedApplyBrazeConsentTransition).toHaveBeenCalledWith(
      {
        isTrackedUser: true,
        userId: REAL_USER_ID,
      },
      {
        prepareForIdentityTransition: expect.any(Function),
        refreshContentCards: expect.any(Function),
      },
    );

    mockSelectors({ isTrackedUser: false, userId: REAL_USER_ID });
    rerender(<HookNotifications />);
    expect(mockedApplyBrazeConsentTransition).toHaveBeenCalledTimes(1);
    mockedUpdateUserPreferences.mockClear();

    await act(async () => {
      completeFirstTransition();
    });

    expect(mockedApplyBrazeConsentTransition).toHaveBeenCalledTimes(2);
    expect(mockedApplyBrazeConsentTransition).toHaveBeenLastCalledWith(
      {
        isTrackedUser: false,
        userId: REAL_USER_ID,
      },
      {
        prepareForIdentityTransition: expect.any(Function),
        refreshContentCards: expect.any(Function),
      },
    );
    expect(mockedUpdateUserPreferences).toHaveBeenCalledWith(defaultNotifications, false, {
      brazeOptOutIdentityCleanup: true,
    });
  });

  it("should write notification preferences directly once a transition has settled", async () => {
    const updatedNotifications = { ...defaultNotifications, topGainersLosers: false };
    mockSelectors({ isTrackedUser: false, userId: REAL_USER_ID });
    const { rerender } = render(<HookNotifications />);

    mockSelectors({ isTrackedUser: true, userId: REAL_USER_ID });
    await act(async () => {
      rerender(<HookNotifications />);
    });
    mockedUpdateUserPreferences.mockClear();

    mockSelectors({
      isTrackedUser: true,
      userId: REAL_USER_ID,
      notifications: updatedNotifications,
    });
    rerender(<HookNotifications />);

    expect(mockedUpdateUserPreferences).toHaveBeenCalledWith(updatedNotifications, true, {
      brazeOptOutIdentityCleanup: true,
    });
  });
});

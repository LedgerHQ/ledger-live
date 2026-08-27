import Braze from "@braze/react-native-sdk";
import { UserId, DUMMY_USER_ID } from "@domain/entity-client-identity";
import { applyBrazeConsentTransition, start, updateUserPreferences } from "./braze";
import type { NotificationsSettings } from "../reducers/types";

const mockedChangeUser = jest.mocked(Braze.changeUser);
const mockedSetCustomUserAttribute = jest.mocked(Braze.setCustomUserAttribute);
const mockedWipeData = jest.mocked(Braze.wipeData);
const mockedEnableSDK = jest.mocked(Braze.enableSDK);
const mockedRequestContentCardsRefresh = jest.mocked(Braze.requestContentCardsRefresh);

const defaultNotifications = {
  areNotificationsAllowed: true,
  announcementsCategory: true,
  largeMoverCategory: false,
  transactionsAlertsCategory: true,
  totalMarketCap: false,
  topGainersLosers: false,
} satisfies NotificationsSettings;

const REAL_USER_ID = UserId.fromString("11111111-1111-1111-1111-111111111111");

describe("start", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when brazeOptOutIdentityCleanup is off (legacy)", () => {
    it("should call changeUser with real id when user is tracked", () => {
      start(true, REAL_USER_ID);
      expect(mockedChangeUser).toHaveBeenCalledWith(REAL_USER_ID.exportUserIdForBraze());
    });

    it("should skip changeUser when user is opted out", () => {
      start(false, REAL_USER_ID);
      expect(mockedChangeUser).not.toHaveBeenCalled();
    });

    it("should skip changeUser when user id is dummy", () => {
      start(true, DUMMY_USER_ID);
      expect(mockedChangeUser).not.toHaveBeenCalled();
    });
  });

  describe("when brazeOptOutIdentityCleanup is on", () => {
    const options = { brazeOptOutIdentityCleanup: true };

    it("should call changeUser with real id when user is tracked", () => {
      start(true, REAL_USER_ID, options);
      expect(mockedChangeUser).toHaveBeenCalledWith(REAL_USER_ID.exportUserIdForBraze());
    });

    it("should skip changeUser when user is opted out", () => {
      start(false, REAL_USER_ID, options);
      expect(mockedChangeUser).not.toHaveBeenCalled();
    });

    it("should skip changeUser when user id is dummy", () => {
      start(false, DUMMY_USER_ID, options);
      expect(mockedChangeUser).not.toHaveBeenCalled();
    });
  });
});

describe("updateUserPreferences", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should write Braze attributes when flag is off even if user is not tracked", () => {
    updateUserPreferences(defaultNotifications, false, {
      brazeOptOutIdentityCleanup: false,
    });

    expect(mockedSetCustomUserAttribute).toHaveBeenCalledWith("notificationsAllowed", true);
  });

  it("should skip Braze writes when flag is on and user is not tracked", () => {
    updateUserPreferences(defaultNotifications, false, {
      brazeOptOutIdentityCleanup: true,
    });

    expect(mockedSetCustomUserAttribute).not.toHaveBeenCalled();
  });

  it("should write Braze attributes when user is tracked", () => {
    updateUserPreferences(defaultNotifications, true, {
      brazeOptOutIdentityCleanup: true,
    });

    expect(mockedSetCustomUserAttribute).toHaveBeenCalledWith("notificationsAllowed", true);
    expect(mockedSetCustomUserAttribute).toHaveBeenCalledWith("optInAnnouncements", true);
    expect(mockedSetCustomUserAttribute).toHaveBeenCalledWith("optInLargeMovers", false);
  });
});

describe("applyBrazeConsentTransition", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should reset the SDK without identifying when opting out", async () => {
    await applyBrazeConsentTransition({ isTrackedUser: false, userId: REAL_USER_ID });

    expect(mockedWipeData).toHaveBeenCalledTimes(1);
    expect(mockedEnableSDK).toHaveBeenCalledTimes(1);
    expect(mockedRequestContentCardsRefresh).toHaveBeenCalledTimes(1);
    expect(mockedChangeUser).not.toHaveBeenCalled();
    expect(mockedWipeData.mock.invocationCallOrder[0]).toBeLessThan(
      mockedEnableSDK.mock.invocationCallOrder[0],
    );
    expect(mockedEnableSDK.mock.invocationCallOrder[0]).toBeLessThan(
      mockedRequestContentCardsRefresh.mock.invocationCallOrder[0],
    );
  });

  it("should recover the SDK then identify with the real user id when opting in", async () => {
    await applyBrazeConsentTransition({ isTrackedUser: true, userId: REAL_USER_ID });

    expect(mockedWipeData).toHaveBeenCalledTimes(1);
    expect(mockedEnableSDK).toHaveBeenCalledTimes(1);
    expect(mockedChangeUser).toHaveBeenCalledTimes(1);
    expect(mockedChangeUser).toHaveBeenCalledWith(REAL_USER_ID.exportUserIdForBraze());
    expect(mockedRequestContentCardsRefresh).toHaveBeenCalledTimes(1);
    expect(mockedWipeData.mock.invocationCallOrder[0]).toBeLessThan(
      mockedEnableSDK.mock.invocationCallOrder[0],
    );
    expect(mockedEnableSDK.mock.invocationCallOrder[0]).toBeLessThan(
      mockedChangeUser.mock.invocationCallOrder[0],
    );
    expect(mockedChangeUser.mock.invocationCallOrder[0]).toBeLessThan(
      mockedRequestContentCardsRefresh.mock.invocationCallOrder[0],
    );
  });

  it("should skip the SDK when the user id is dummy", async () => {
    await applyBrazeConsentTransition({ isTrackedUser: true, userId: DUMMY_USER_ID });

    expect(mockedWipeData).not.toHaveBeenCalled();
    expect(mockedEnableSDK).not.toHaveBeenCalled();
    expect(mockedChangeUser).not.toHaveBeenCalled();
    expect(mockedRequestContentCardsRefresh).not.toHaveBeenCalled();
  });
});

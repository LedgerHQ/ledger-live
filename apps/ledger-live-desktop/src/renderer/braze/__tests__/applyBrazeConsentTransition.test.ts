import { UserId, DUMMY_USER_ID } from "@domain/entity-client-identity";
import * as braze from "@braze/web-sdk";
import { applyBrazeConsentTransition } from "../applyBrazeConsentTransition";

const mockedChangeUser = jest.mocked(braze.changeUser);
const mockedWipeData = jest.mocked(braze.wipeData);
const mockedEnableSDK = jest.mocked(braze.enableSDK);
const mockedRequestContentCardsRefresh = jest.mocked(braze.requestContentCardsRefresh);

const REAL_USER_ID = UserId.fromString("11111111-1111-1111-1111-111111111111");

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

  it("should route consent refreshes through the lifecycle owner", async () => {
    const prepareForIdentityTransition = jest.fn();
    const refreshContentCards = jest.fn().mockResolvedValue(undefined);

    await applyBrazeConsentTransition(
      { isTrackedUser: true, userId: REAL_USER_ID },
      { prepareForIdentityTransition, refreshContentCards },
    );

    expect(prepareForIdentityTransition).toHaveBeenCalledTimes(1);
    expect(refreshContentCards).toHaveBeenCalledTimes(1);
    expect(mockedRequestContentCardsRefresh).not.toHaveBeenCalled();
    expect(prepareForIdentityTransition.mock.invocationCallOrder[0]).toBeLessThan(
      mockedWipeData.mock.invocationCallOrder[0],
    );
    expect(mockedChangeUser.mock.invocationCallOrder[0]).toBeLessThan(
      refreshContentCards.mock.invocationCallOrder[0],
    );
  });
});

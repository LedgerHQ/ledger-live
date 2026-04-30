/* eslint-disable @typescript-eslint/consistent-type-assertions */

import {
  AppInteractionRequiredStateType,
  BlockingStateType,
  DeviceInteractionRequiredType,
  EnsureAppReadyState,
  FinalStateType,
  isRetryableState,
  LoadingStateType,
  RetryableStateType,
} from "./state";

describe("isRetryableState", () => {
  type NonRetryableStateType = Exclude<EnsureAppReadyState["type"], RetryableStateType>;

  /**
   * This object is forced by its typing to be exhaustive.
   */
  const retryableStates: Record<RetryableStateType, true> = {
    [RetryableStateType.DeviceLocked]: true,
    [RetryableStateType.UserRefusedOnDevice]: true,
    [RetryableStateType.DeviceBusy]: true,
  };

  /**
   * This object is forced by its typing to be exhaustive.
   */
  const allOtherStates: Record<NonRetryableStateType, true> = {
    [LoadingStateType.Loading]: true,
    [LoadingStateType.InstallingApp]: true,
    [DeviceInteractionRequiredType.UnlockDevice]: true,
    [DeviceInteractionRequiredType.AllowSecureConnection]: true,
    [DeviceInteractionRequiredType.ConfirmOpenApp]: true,
    [AppInteractionRequiredStateType.DeviceDeprecatedNonBlocking]: true,
    [AppInteractionRequiredStateType.OutdatedAppWarning]: true,
    [BlockingStateType.UnsupportedFirmwareVersion]: true,
    [BlockingStateType.UnsupportedApplication]: true,
    [BlockingStateType.UnsupportedFeature]: true,
    [BlockingStateType.DeviceDeprecatedBlocking]: true,
    [BlockingStateType.WrongDeviceForAccount]: true,
    [BlockingStateType.DeviceOutOfStorageSpace]: true,
    [BlockingStateType.DeviceNotOnboarded]: true,
    [FinalStateType.Error]: true,
    [FinalStateType.Success]: true,
  };

  it.each(Object.keys(retryableStates))("should return true for retryable state %s", state => {
    expect(isRetryableState({ type: state as RetryableStateType } as EnsureAppReadyState)).toBe(
      true,
    );
  });

  it.each(Object.keys(allOtherStates))("should return false for non-retryable state %s", state => {
    expect(
      isRetryableState({
        type: state as NonRetryableStateType,
      } as EnsureAppReadyState),
    ).toBe(false);
  });
});

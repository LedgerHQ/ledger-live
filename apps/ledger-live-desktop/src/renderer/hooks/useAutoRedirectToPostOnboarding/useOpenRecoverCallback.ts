import { isRecoverDisplayed, useFeature } from "@ledgerhq/live-common/featureFlags/index";
import {
  Source,
  useAlreadySeededDevicePath,
  useRestore24Path,
  useUpsellPath,
  useTouchScreenOnboardingUpsellPath,
} from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router";
import {
  lastOnboardedDeviceSelector,
  onboardingUseCaseSelector,
} from "~/renderer/reducers/settings";
import { OnboardingUseCase } from "~/renderer/components/Onboarding/OnboardingUseCase";
import { setHasBeenUpsoldRecover } from "~/renderer/actions/settings";

export function useOpenRecoverCallback() {
  const dispatch = useDispatch();
  const history = useHistory<{ fromRecover: boolean } | undefined>();
  const onboardingUseCase = useSelector(onboardingUseCaseSelector);
  const recoverFF = useFeature("protectServicesDesktop");
  const upsellPath = useUpsellPath(recoverFF);
  const restore24Path = useRestore24Path(recoverFF);
  const devicePairingPath = useAlreadySeededDevicePath(recoverFF);
  const touchScreenPath = useTouchScreenOnboardingUpsellPath(recoverFF, Source.LLD_ONBOARDING_24);
  const lastOnboardedDevice = useSelector(lastOnboardedDeviceSelector);

  return useCallback(
    async ({ fallbackRedirection }: { fallbackRedirection: () => void }) => {
      function redirect(path: string) {
        history.push(path);
        dispatch(setHasBeenUpsoldRecover(true));
      }
      if (!navigator.onLine) {
        fallbackRedirection();
      } else if (
        lastOnboardedDevice &&
        [DeviceModelId.stax, DeviceModelId.europa].includes(lastOnboardedDevice.modelId) &&
        touchScreenPath
      ) {
        redirect(touchScreenPath);
      } else if (isRecoverDisplayed(recoverFF, lastOnboardedDevice?.modelId)) {
        if (onboardingUseCase === OnboardingUseCase.setupDevice && upsellPath) {
          redirect(upsellPath);
        } else if (onboardingUseCase === OnboardingUseCase.recoveryPhrase && restore24Path) {
          redirect(restore24Path);
        } else if (onboardingUseCase === OnboardingUseCase.connectDevice && devicePairingPath) {
          redirect(devicePairingPath);
        } else {
          fallbackRedirection();
        }
      } else {
        fallbackRedirection();
      }
    },
    [
      devicePairingPath,
      dispatch,
      history,
      lastOnboardedDevice,
      onboardingUseCase,
      recoverFF,
      restore24Path,
      touchScreenPath,
      upsellPath,
    ],
  );
}

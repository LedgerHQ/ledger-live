import React, { useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { Flex, Text } from "@ledgerhq/react-ui";
import { DeviceOnboarded } from "@ledgerhq/live-common/errors";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import OnboardingNavHeader from "../Onboarding/OnboardingNavHeader";
import { DeviceModelId } from "@ledgerhq/devices";
import { OnboardingContext, UseCase } from "../Onboarding";
import { ScreenId } from "../Onboarding/Screens/Tutorial";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getVersion from "@ledgerhq/live-common/hw/getVersion";
import { first } from "rxjs/operators";
import { from } from "rxjs";
import {
  OnboardingState,
  extractOnboardingState,
} from "@ledgerhq/live-common/hw/extractOnboardingState";
import { FirmwareInfo } from "@ledgerhq/types-live";
import { renderError } from "../DeviceAction/rendering";

const RecoverRestore = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const currentDevice = useSelector(getCurrentDevice);
  const [state, setState] = useState<OnboardingState>();
  const [error, setError] = useState<Error>();
  const { setDeviceModelId } = useContext(OnboardingContext);

  // check if device is seeded when selected
  useEffect(() => {
    if (currentDevice) {
      const requestObservable = withDevice(currentDevice.deviceId)(t => from(getVersion(t))).pipe(
        first(),
      );

      const sub = requestObservable.subscribe({
        next: (firmware: FirmwareInfo) => {
          try {
            setState(extractOnboardingState(firmware.flags));
          } catch (error: unknown) {
            if (error instanceof Error) {
              setError(error);
            }
          }
        },
        error: (error: Error) => {
          setError(error);
        },
      });

      return () => {
        sub.unsubscribe();
      };
    }
  }, [currentDevice]);

  useEffect(() => {
    if (state && !state.isOnboarded) {
      switch (currentDevice?.modelId) {
        case DeviceModelId.nanoX:
          setDeviceModelId(currentDevice.modelId);
          history.push(`/onboarding/${UseCase.recover}/${ScreenId.pairMyNano}`);
          break;
        case DeviceModelId.stax:
          history.push(`/onboarding/sync/${currentDevice.modelId}`);
          break;
        default:
          break;
      }
    }
  }, [currentDevice?.modelId, history, setDeviceModelId, state]);

  if (error) {
    return renderError({
      t,
      error,
      device: currentDevice,
    });
  }

  if (state?.isOnboarded) {
    return (
      <Flex width="100%" height="100%" position="relative">
        <Flex position="relative" height="100%" width="100%" flexDirection="column">
          <OnboardingNavHeader onClickPrevious={() => history.push("/onboarding/select-device")} />
          {renderError({
            t,
            error: new DeviceOnboarded(t("errors.DeviceAlreadySetup.title")),
            device: currentDevice,
          })}
        </Flex>
      </Flex>
    );
  }

  return (
    <Flex width="100%" height="100%" position="relative">
      <Flex position="relative" height="100%" width="100%" flexDirection="column">
        <OnboardingNavHeader onClickPrevious={() => history.push("/onboarding/select-device")} />
        <Flex flex={1} alignItems="center" justifyContent="center" flexDirection="column">
          <Text
            variant="h3Inter"
            color="neutral.c100"
            mt={16}
            data-test-id="recover-restore-connect-text"
          >
            {t("recoverRestore.title")}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default withV3StyleProvider(RecoverRestore);

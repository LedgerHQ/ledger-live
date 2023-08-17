import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { Flex, Text } from "@ledgerhq/react-ui";
import { DeviceAlreadySetup } from "@ledgerhq/live-common/errors";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import OnboardingNavHeader from "../Onboarding/OnboardingNavHeader";
import { DeviceModelId } from "@ledgerhq/devices";
import { OnboardingContext, UseCase } from "../Onboarding";
import { ScreenId } from "../Onboarding/Screens/Tutorial";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import getVersion from "@ledgerhq/live-common/hw/getVersion";
import { first } from "rxjs/operators";
import { Subscription, from } from "rxjs";
import {
  OnboardingState,
  extractOnboardingState,
} from "@ledgerhq/live-common/hw/extractOnboardingState";
import { FirmwareInfo } from "@ledgerhq/types-live";
import { renderError } from "../DeviceAction/rendering";
import { urls } from "~/config/urls";
import { languageSelector } from "~/renderer/reducers/settings";

const RecoverRestore = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const currentDevice = useSelector(getCurrentDevice);
  const [state, setState] = useState<OnboardingState>();
  const [error, setError] = useState<Error>();
  const { setDeviceModelId } = useContext(OnboardingContext);
  const locale = useSelector(languageSelector) || "en";
  const sub = useRef<Subscription>();

  const getOnboardingState = useCallback((device: Device) => {
    sub.current?.unsubscribe();

    const requestObservable = withDevice(device.deviceId)(t => from(getVersion(t))).pipe(first());

    sub.current = requestObservable.subscribe({
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
  }, []);

  // check if device is seeded when selected
  useEffect(() => {
    if (currentDevice) {
      getOnboardingState(currentDevice);

      return () => {
        sub.current?.unsubscribe();
        sub.current = undefined;
      };
    }
  }, [currentDevice, getOnboardingState]);

  // cleanup subscription in case of retry and component unmount
  useEffect(() => {
    return () => {
      sub.current?.unsubscribe();
      sub.current = undefined;
    };
  }, []);

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

  const onRetry = useCallback(() => {
    setState(undefined);
    setError(undefined);
    if (currentDevice) getOnboardingState(currentDevice);
  }, [currentDevice, getOnboardingState]);

  if (error) {
    return renderError({
      t,
      error,
      device: currentDevice,
      onRetry,
    });
  }

  if (state?.isOnboarded) {
    return (
      <Flex width="100%" height="100%" position="relative">
        <Flex position="relative" height="100%" width="100%" flexDirection="column">
          <OnboardingNavHeader onClickPrevious={() => history.push("/onboarding/select-device")} />
          {renderError({
            t,
            error: new DeviceAlreadySetup("", { device: currentDevice?.modelId ?? "device" }),
            buyLedger:
              urls.noDevice.buyNew[
                locale in urls.terms ? (locale as keyof typeof urls.noDevice.buyNew) : "en"
              ],
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

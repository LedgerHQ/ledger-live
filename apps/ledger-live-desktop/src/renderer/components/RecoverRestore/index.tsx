import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useFeature } from "@ledgerhq/live-config/featureFlags/index";
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
  OnboardingStep,
  extractOnboardingState,
} from "@ledgerhq/live-common/hw/extractOnboardingState";
import { FirmwareInfo, SeedPhraseType } from "@ledgerhq/types-live";
import { renderError } from "../DeviceAction/rendering";
import { useDynamicUrl } from "~/renderer/terms";
import { isDeviceNotOnboardedError } from "../DeviceAction/utils";
import connectDeviceImage from "~/renderer/images/connect-device.svg";
import Image from "../Image";

const RecoverRestore = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const recoverFF = useFeature("protectServicesDesktop");
  const currentDevice = useSelector(getCurrentDevice);
  const [state, setState] = useState<OnboardingState>();
  const [error, setError] = useState<Error>();
  const { setDeviceModelId } = useContext(OnboardingContext);
  const buyNew = useDynamicUrl("buyNew");
  const sub = useRef<Subscription>();
  const recoverDiscoverPath = useMemo(() => {
    return `/recover/${recoverFF?.params?.protectId}?redirectTo=disclaimerRestore`;
  }, [recoverFF?.params?.protectId]);

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
        if (isDeviceNotOnboardedError(error)) {
          setState({
            isOnboarded: false,
            isInRecoveryMode: false,
            seedPhraseType: SeedPhraseType.TwentyFour,
            currentOnboardingStep: OnboardingStep.NewDevice,
            currentSeedWordIndex: 0,
          });
        } else {
          setError(error);
        }
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
        case DeviceModelId.nanoSP:
          setDeviceModelId(currentDevice.modelId);
          history.push({
            pathname: `/onboarding/${UseCase.recover}/${ScreenId.pairMyNano}`,
            state: {
              fromRecover: true,
            },
          });
          break;
        case DeviceModelId.stax:
          history.push({
            pathname: `/onboarding/sync/${currentDevice.modelId}`,
            state: { fromRecover: true },
          });
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
          <OnboardingNavHeader onClickPrevious={() => history.push(recoverDiscoverPath)} />
          {renderError({
            t,
            error: new DeviceAlreadySetup("", { device: currentDevice?.modelId ?? "device" }),
            buyLedger: buyNew,
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
          <Image resource={connectDeviceImage} alt="connect your device" />
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

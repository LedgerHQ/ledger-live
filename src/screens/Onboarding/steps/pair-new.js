// @flow
import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import connectManager from "@ledgerhq/live-common/lib/hw/connectManager";
import { createAction } from "@ledgerhq/live-common/lib/hw/actions/manager";
import { TrackScreen } from "../../../analytics";
import Button from "../../../components/Button";
import SelectDevice from "../../../components/SelectDevice";
import DeviceActionModal from "../../../components/DeviceActionModal";
import OnboardingLayout from "../OnboardingLayout";
import { useNavigationInterceptor } from "../onboardingContext";
import {
  installAppFirstTime,
  setReadOnlyMode,
} from "../../../actions/settings";

const action = createAction(connectManager);

export default function OnboardingStepPairNew() {
  const { deviceModelId, next } = useNavigationInterceptor();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [device, setDevice] = useState<?Device>();

  const Footer = () =>
    __DEV__ ? (
      <Button
        event="OnboardingPairSkip"
        type="lightSecondary"
        title="(DEV) skip this step"
        onPress={next}
      />
    ) : null;

  const directNext = useCallback(() => {
    dispatch(setReadOnlyMode(false));
    next();
  }, [dispatch, next]);

  const onResult = useCallback(
    (info: any) => {
      /** if list apps succeed we update settings with state of apps installed */
      if (info) {
        const hasAnyAppinstalled =
          info.result &&
          info.result.installed &&
          info.result.installed.length > 0;

        dispatch(installAppFirstTime(hasAnyAppinstalled));
        setDevice();
        dispatch(setReadOnlyMode(false));
        next();
      }
    },
    [dispatch, next],
  );

  const usbOnly = ["nanoS", "blue"].includes(deviceModelId);

  return (
    <OnboardingLayout
      header="OnboardingStepPairNew"
      Footer={Footer}
      borderedFooter
      noTopPadding
      withNeedHelp
      titleOverride={
        usbOnly
          ? t(`onboarding.stepsTitles.OnboardingStepConnectNew`)
          : undefined
      }
    >
      <TrackScreen category="Onboarding" name="PairNew" />
      <SelectDevice
        withArrows
        usbOnly={usbOnly}
        deviceModelId={deviceModelId}
        onSelect={usbOnly ? setDevice : directNext}
        autoSelectOnAdd
      />
      <DeviceActionModal
        onClose={setDevice}
        device={device}
        onResult={onResult}
        action={action}
        request={null}
      />
    </OnboardingLayout>
  );
}

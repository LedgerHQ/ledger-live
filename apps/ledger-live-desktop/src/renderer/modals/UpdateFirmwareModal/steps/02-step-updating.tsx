import React, { useEffect } from "react";
import { from } from "rxjs";
import { timeout } from "rxjs/operators";
import styled from "styled-components";
import { DeviceModelId } from "@ledgerhq/devices";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { withDevicePolling } from "@ledgerhq/live-common/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import { StepProps } from "..";
import { getEnv } from "@ledgerhq/live-common/env";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import { renderFirmwareUpdating } from "~/renderer/components/DeviceAction/rendering";
import { isDeviceLocalizationSupported } from "@ledgerhq/live-common/manager/localization";
import useTheme from "~/renderer/hooks/useTheme";

const Container = styled(Box).attrs(() => ({
  alignItems: "center",
  fontSize: 4,
  color: "palette.text.shade100",
}))``;

type BodyProps = {
  modelId: DeviceModelId;
};

export const Body = ({ modelId }: BodyProps) => {
  const type = useTheme("colors.palette.type");
  return renderFirmwareUpdating({ modelId, type });
};

type Props = StepProps;

const StepUpdating = ({
  firmware,
  deviceModelId,
  setError,
  transitionTo,
  setUpdatedDeviceInfo,
}: Props) => {
  const deviceLocalizationFeatureFlag = useFeature("deviceLocalization");

  useEffect(() => {
    const sub = (getEnv("MOCK")
      ? mockedEventEmitter()
      : withDevicePolling("")(
          transport => from(getDeviceInfo(transport)),
          () => true,
        )
    )
      .pipe(timeout(5 * 60 * 1000))
      .subscribe({
        next: setUpdatedDeviceInfo,
        complete: () => {
          const shouldGoToLanguageStep =
            firmware &&
            isDeviceLocalizationSupported(firmware.final.name, deviceModelId) &&
            deviceLocalizationFeatureFlag?.enabled;
          transitionTo(shouldGoToLanguageStep ? "deviceLanguage" : "finish");
        },
        error: (error: Error) => {
          setError(error);
          transitionTo("finish");
        },
      });

    return () => {
      if (sub) {
        sub.unsubscribe();
      }
    };
  }, [
    setError,
    transitionTo,
    firmware,
    deviceModelId,
    setUpdatedDeviceInfo,
    deviceLocalizationFeatureFlag?.enabled,
  ]);

  return (
    <Container>
      <TrackPage category="Manager" name="Firmware Updating" />
      <Body modelId={deviceModelId} />
    </Container>
  );
};

export default StepUpdating;

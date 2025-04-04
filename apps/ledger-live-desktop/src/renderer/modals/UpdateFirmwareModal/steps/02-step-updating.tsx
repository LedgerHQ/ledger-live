import React, { useEffect } from "react";
import { from } from "rxjs";
import { timeout } from "rxjs/operators";
import styled from "styled-components";
import { DeviceModelId } from "@ledgerhq/devices";
import { withDevicePolling } from "@ledgerhq/live-common/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import { getEnv } from "@ledgerhq/live-env";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import { renderFirmwareUpdating } from "~/renderer/components/DeviceAction/rendering";
import useTheme from "~/renderer/hooks/useTheme";
import { StepProps } from "../types";
import { isRestoreStepEnabled } from "../helpers/createFirmwareUpdateSteps";

const Container = styled(Box).attrs(() => ({
  alignItems: "center",
  fontSize: 4,
  color: "palette.text.shade100",
}))``;

type BodyProps = {
  modelId: DeviceModelId;
  deviceHasPin?: boolean | undefined;
  downloadPhase?: { current: number; total: number };
};

type StepUpdatingProps = StepProps & {
  downloadPhase?: { current: number; total: number };
};

export const Body = ({ modelId, deviceHasPin, downloadPhase }: BodyProps) => {
  const type = useTheme().colors.palette.type;
  return renderFirmwareUpdating({ modelId, type, deviceHasPin, downloadPhase });
};

const StepUpdating = ({
  firmware,
  deviceModelId,
  setError,
  transitionTo,
  setUpdatedDeviceInfo,
  deviceHasPin,
  downloadPhase,
}: StepUpdatingProps) => {
  useEffect(() => {
    const sub = (
      getEnv("MOCK")
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
          const nextStep = isRestoreStepEnabled(deviceModelId, firmware) ? "restore" : "finish";
          transitionTo(nextStep);
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
  }, [setError, transitionTo, firmware, deviceModelId, setUpdatedDeviceInfo]);

  return (
    <Container>
      <TrackPage category="Manager" name="Firmware Updating" />
      <Body modelId={deviceModelId} deviceHasPin={deviceHasPin} downloadPhase={downloadPhase} />
    </Container>
  );
};

export default StepUpdating;

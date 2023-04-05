import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { timeout } from "rxjs/operators";
import { Subscriber, from } from "rxjs";
import styled from "styled-components";
import { DeviceModelId } from "@ledgerhq/devices";
import { DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { hasFinalFirmware } from "@ledgerhq/live-common/hw/hasFinalFirmware";
import { isDeviceLocalizationSupported } from "@ledgerhq/live-common/manager/localization";
import firmwareUpdateMain from "@ledgerhq/live-common/hw/firmwareUpdate-main";
import { withDevicePolling } from "@ledgerhq/live-common/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import FlashMCU from "~/renderer/components/FlashMCU";
import Installing from "../Installing";
import { StepProps } from "..";
import { getEnv } from "@ledgerhq/live-common/env";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import { Body as StepUpdatingBody } from "./02-step-updating";

const Container = styled(Box).attrs(() => ({
  alignItems: "center",
  fontSize: 4,
  color: "palette.text.shade100",
}))``;

const Title = styled(Box).attrs(() => ({
  ff: "Inter|Regular",
  fontSize: 5,
  mb: 3,
}))``;

type BodyProps = {
  installing?: string;
  progress: number;
  deviceModelId: DeviceModelId;
  firmware: FirmwareUpdateContext;
  initialDelayPhase: boolean;
};

const Body = ({ installing, progress, firmware, deviceModelId, initialDelayPhase }: BodyProps) => {
  return installing || !firmware.shouldFlashMCU || initialDelayPhase ? (
    <Installing installing={installing} progress={progress} />
  ) : (
    <FlashMCU deviceModelId={deviceModelId} />
  );
};

type Props = StepProps;

const DELAY_PHASE = 10000;

const StepFlashMcu = ({
  firmware,
  deviceModelId,
  setError,
  transitionTo,
  setUpdatedDeviceInfo,
}: Props) => {
  const { t } = useTranslation();
  const [installing, setInstalling] = useState<string | undefined>(undefined);
  const [initialDelayPhase, setInitialDelayPhase] = useState(true);
  // when autoUpdatingMode is true, we simply display the same content as in "step-updating" as the device turns into auto update mode
  const [autoUpdatingMode, setAutoUpdatingMode] = useState(false);
  const [progress, setProgress] = useState(0);
  const withFinal = useMemo(() => hasFinalFirmware(firmware?.final), [firmware]);

  const [isMcuUpdateFinished, setIsMcuUpdateFinished] = useState<boolean>(false);
  const deviceLocalizationFeatureFlag = useFeature("deviceLocalization");

  // Gets the updated device info from the command waitForDeviceInfo
  // after a successful MCU update
  useEffect(() => {
    let sub: null | Subscriber<DeviceInfo>;

    if (isMcuUpdateFinished) {
      sub = (getEnv("MOCK")
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
    }

    return () => {
      if (sub) {
        sub.unsubscribe();
      }
    };
  }, [
    deviceLocalizationFeatureFlag?.enabled,
    deviceModelId,
    firmware,
    isMcuUpdateFinished,
    setError,
    setUpdatedDeviceInfo,
    transitionTo,
  ]);

  // Updates the MCU
  useEffect(() => {
    setTimeout(() => {
      setInitialDelayPhase(false);
    }, DELAY_PHASE);
    let endOfFirstFlashMcuTimeout: null | ReturnType<typeof setTimeout>;

    const sub = (getEnv("MOCK")
      ? mockedEventEmitter()
      : firmwareUpdateMain("", firmware)
    ).subscribe({
      next: ({ progress, installing }: { progress: number; installing: string }) => {
        setProgress(progress);
        setInstalling(installing);
        if (!withFinal && installing === "flash-mcu" && progress === 1) {
          // set a flag to display the "updating" mode
          // timeout will debounces the UI to not see the "loading" if there are possible second mcu in future
          endOfFirstFlashMcuTimeout = setTimeout(() => setAutoUpdatingMode(true), 1000);
        } else {
          if (endOfFirstFlashMcuTimeout) {
            clearTimeout(endOfFirstFlashMcuTimeout);
            endOfFirstFlashMcuTimeout = null;
          }
        }
      },
      complete: () => {
        setIsMcuUpdateFinished(true);
      },
      error: (error: Error) => {
        setError(error);
        transitionTo("finish");
      },
    });

    return () => {
      if (endOfFirstFlashMcuTimeout) {
        clearTimeout(endOfFirstFlashMcuTimeout);
      }
      if (sub) {
        sub.unsubscribe();
      }
    };
  }, [deviceModelId, firmware, setError, transitionTo, withFinal]);

  if (autoUpdatingMode) {
    return (
      <Container>
        <TrackPage category="Manager" name="Firmware Updating" />
        <StepUpdatingBody modelId={deviceModelId} />
      </Container>
    );
  }

  return (
    <Container data-test-id="firmware-update-flash-mcu-progress">
      <Title>{installing ? "" : t("manager.modal.mcuTitle")}</Title>
      <TrackPage category="Manager" name="FlashMCU" />
      <Body
        deviceModelId={deviceModelId}
        firmware={firmware}
        installing={installing}
        progress={progress}
        initialDelayPhase={initialDelayPhase}
      />
    </Container>
  );
};

export default StepFlashMcu;

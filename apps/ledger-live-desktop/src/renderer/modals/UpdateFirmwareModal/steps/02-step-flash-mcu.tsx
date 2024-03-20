import React, { useState, useEffect, useMemo } from "react";
import { timeout } from "rxjs/operators";
import { Subscriber, from } from "rxjs";
import styled from "styled-components";
import { DeviceModelId } from "@ledgerhq/devices";
import { DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import { hasFinalFirmware } from "@ledgerhq/live-common/hw/hasFinalFirmware";
import { isDeviceLocalizationSupported } from "@ledgerhq/live-common/device-core/commands/use-cases/isDeviceLocalizationSupported";
import firmwareUpdateMain from "@ledgerhq/live-common/hw/firmwareUpdate-main";
import { withDevicePolling } from "@ledgerhq/live-common/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import { getEnv } from "@ledgerhq/live-env";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import FlashMCU from "~/renderer/components/FlashMCU";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import Installing from "../Installing";
import { Body as StepUpdatingBody } from "./02-step-updating";
import { StepProps } from "../types";

const Container = styled(Box).attrs(() => ({
  alignItems: "center",
  fontSize: 4,
  color: "palette.text.shade100",
}))``;

type BodyProps = {
  installing?: string;
  progress: number;
  deviceModelId: DeviceModelId;
  firmware?: FirmwareUpdateContext;
  initialDelayPhase: boolean;
  current: number;
  total: number;
};

const Body = ({
  installing,
  progress,
  firmware,
  deviceModelId,
  initialDelayPhase,
  current,
  total,
}: BodyProps) => {
  return installing || !firmware?.shouldFlashMCU || initialDelayPhase ? (
    <Installing
      isInstalling={!!installing}
      current={current}
      total={total}
      progress={progress}
      deviceModelId={deviceModelId}
    />
  ) : (
    <FlashMCU deviceModelId={deviceModelId} />
  );
};

const DELAY_PHASE = 10000;

const StepFlashMcu = ({
  firmware,
  deviceModelId,
  setError,
  transitionTo,
  setUpdatedDeviceInfo,
  deviceHasPin,
}: StepProps) => {
  const [installing, setInstalling] = useState<string | undefined>(undefined);
  const [initialDelayPhase, setInitialDelayPhase] = useState(true);

  // In order to be able to show a progress wording such as 'Installing update 1 of 3'
  const [maxSteps, setMaxSteps] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  // when autoUpdatingMode is true, we simply display the same content as in "step-updating" as the device turns into auto update mode
  const [autoUpdatingMode, setAutoUpdatingMode] = useState(false);
  const [progress, setProgress] = useState(0);
  const withFinal = useMemo(() => hasFinalFirmware(firmware?.final), [firmware]);

  const [isMcuUpdateFinished, setIsMcuUpdateFinished] = useState<boolean>(false);

  // Gets the updated device info from the command waitForDeviceInfo
  // after a successful MCU update
  useEffect(() => {
    let sub: null | Subscriber<DeviceInfo>;

    if (isMcuUpdateFinished) {
      sub = (
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
            const shouldGoToLanguageStep =
              firmware && isDeviceLocalizationSupported(firmware.final.name, deviceModelId);
            transitionTo(shouldGoToLanguageStep ? "restore" : "finish");
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
  }, [deviceModelId, firmware, isMcuUpdateFinished, setError, setUpdatedDeviceInfo, transitionTo]);

  useEffect(() => {
    if (!installing) return;

    // Whenever the 'installing' state changes we are flashing a different step,
    // leverage this to guess the number of steps and which one we are on.
    setMaxSteps(maxSteps => {
      if (maxSteps) return maxSteps; // If we've already set a max step, we rely on that.
      return installing === "flash-bootloader" ? 3 : installing === "flash-mcu" ? 2 : 1;
    });

    // A change here also means we've moved to a new step, so increase the counter (?)
    setCurrentStep(currentStep => currentStep + 1);
  }, [installing]);

  // Updates the MCU
  useEffect(() => {
    if (!firmware) return;

    setTimeout(() => {
      setInitialDelayPhase(false);
    }, DELAY_PHASE);
    let endOfFirstFlashMcuTimeout: null | ReturnType<typeof setTimeout>;

    const sub = (
      getEnv("MOCK") ? mockedEventEmitter() : firmwareUpdateMain("", firmware)
    ).subscribe({
      next: ({ progress, installing }: { progress: number; installing: string }) => {
        setProgress(progress);
        setInstalling(installing);
        if (!withFinal && installing === "flash-mcu" && progress === 1) {
          // set a flag to display the "updating" mode
          // timeout will debounces the UI to not see the "loading" if there are possible second mcu in future

          endOfFirstFlashMcuTimeout = setTimeout(() => {
            setCurrentStep(currentStep => currentStep + 1);
            setAutoUpdatingMode(true);
          }, 1000);
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
        <StepUpdatingBody
          modelId={deviceModelId}
          deviceHasPin={deviceHasPin}
          downloadPhase={{ current: currentStep, total: maxSteps }}
        />
      </Container>
    );
  }

  return (
    <Container data-test-id="firmware-update-flash-mcu-progress">
      <TrackPage category="Manager" name="FlashMCU" />
      <Body
        deviceModelId={deviceModelId}
        firmware={firmware}
        installing={installing}
        current={currentStep}
        total={maxSteps}
        progress={progress}
        initialDelayPhase={initialDelayPhase}
      />
    </Container>
  );
};

export default StepFlashMcu;

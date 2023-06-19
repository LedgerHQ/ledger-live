import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Flex, ProgressLoader, Icons } from "@ledgerhq/react-ui";
import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import { FirmwareUpdateContext, DeviceInfo } from "@ledgerhq/types-live";
import { hasFinalFirmware } from "@ledgerhq/live-common/hw/hasFinalFirmware";
import staxFetchImage, { FetchImageEvent } from "@ledgerhq/live-common/hw/staxFetchImage";
import firmwareUpdatePrepare from "@ledgerhq/live-common/hw/firmwareUpdate-prepare";
import { getEnv } from "@ledgerhq/live-common/env";
import { UnexpectedBootloader } from "@ledgerhq/errors";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import TrackPage from "~/renderer/analytics/TrackPage";
import Track from "~/renderer/analytics/Track";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import Interactions from "~/renderer/icons/device/interactions";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import Animation from "~/renderer/animations";
import { getDeviceAnimation } from "~/renderer/components/DeviceAction/animations";
import { AnimationWrapper, Title } from "~/renderer/components/DeviceAction/rendering";
import useTheme from "~/renderer/hooks/useTheme";
import { EMPTY, concat } from "rxjs";
import { catchError, map, tap } from "rxjs/operators";
import { DeviceBlocker } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { StepProps } from "..";
import manager from "@ledgerhq/live-common/manager/index";

const Container = styled(Box).attrs(() => ({
  alignItems: "center",
  fontSize: 4,
  color: "palette.text.shade100",
  px: 7,
}))``;

const HighlightVersion = styled(Text).attrs(() => ({
  backgroundColor: "neutral.c30",
  color: "palette.text.shade100",
  ff: "Inter|SemiBold",
  variant: "subtitle",
  px: 2,
  py: 1,
  mx: 3,
}))`
  display: inline-block;
  word-break: break-word;
  border-radius: 4px;
  text-align: center;
`;

const Body = ({
  displayedOnDevice,
  progress,
  deviceModelId,
  firmware,
  deviceInfo,
  step,
  hasHash,
}: {
  displayedOnDevice: boolean;
  progress: number;
  deviceModelId: DeviceModelId;
  firmware: FirmwareUpdateContext;
  deviceInfo: DeviceInfo;
  step: string;
  hasHash?: boolean;
}) => {
  const { t } = useTranslation();
  const type = useTheme().colors.palette.type;
  const deviceModel = getDeviceModel(deviceModelId);
  const isBlue = deviceModelId === "blue";
  const from = deviceInfo.version;
  const to = firmware?.final.name;
  const normalProgress = (progress || 0) * 100;

  if (!displayedOnDevice) {
    return (
      <Box my={5} alignItems="center">
        <Flex alignItems="center" justifyContent="center" borderRadius={9999} size={60} mb={5}>
          <ProgressLoader
            stroke={8}
            infinite={!normalProgress}
            progress={normalProgress}
            showPercentage={false}
          />
        </Flex>
        <Title>
          {step !== "transfer"
            ? t("manager.modal.steps.preparingUpdate")
            : t("manager.modal.steps.transferringUpdate", { productName: deviceModel.productName })}
        </Title>
      </Box>
    );
  }

  if (displayedOnDevice) {
    return (
      <>
        <Track event={"FirmwareUpdateConfirmNewFirwmare"} onMount />
        <DeviceBlocker />
        {isBlue ? (
          <Box mt={4}>
            <Interactions
              wire="wired"
              type={deviceModelId}
              width={150}
              screen="validation"
              action="accept"
            />
          </Box>
        ) : (
          <Box mb={8}>
            <Animation animation={getDeviceAnimation(deviceModelId, type, "verify")} />
          </Box>
        )}
        {hasHash ? (
          <HighlightVersion>
            {firmware.osu &&
              manager
                .formatHashName(firmware.osu.hash, deviceModelId, deviceInfo)
                .map((hash, i) => <span key={`${i}-${hash}`}>{hash}</span>)}
          </HighlightVersion>
        ) : (
          <Flex flexDirection="row" alignItems="center" my={2}>
            <>
              <HighlightVersion>{`V ${from}`}</HighlightVersion>
              <Icons.ArrowRightMedium size={14} />
              <HighlightVersion>{`V ${to}`}</HighlightVersion>
            </>
          </Flex>
        )}

        <Text ff="Inter|Regular" textAlign="center" color="palette.text.shade100">
          {t("manager.modal.confirmIdentifierText", { productName: deviceModel.productName })}
        </Text>
      </>
    );
  }

  return (
    <>
      <Track event={"FirmwareUpdateConfirmNewFirwmare"} onMount />
      <Box mx={7} mt={5} mb={isBlue ? 0 : 5}>
        <Text ff="Inter|SemiBold" textAlign="center" color="palette.text.shade100">
          {t("manager.modal.confirmUpdate")}
        </Text>
      </Box>
      {isBlue ? (
        <Box mt={4}>
          <Interactions
            wire="wired"
            type={deviceModelId}
            width={150}
            screen="validation"
            action="accept"
          />
        </Box>
      ) : (
        <AnimationWrapper>
          <Animation animation={getDeviceAnimation(deviceModelId, type, "verify")} />
        </AnimationWrapper>
      )}
    </>
  );
};

const StepPrepare = ({
  firmware,
  deviceModelId,
  deviceInfo,
  transitionTo,
  setError,
  setCLSBackup,
}: StepProps) => {
  const device = useSelector(getCurrentDevice);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState("");
  const [displayedOnDevice, setDisplayedOnDevice] = useState(false);

  useEffect(() => {
    if (!firmware) return;
    if (!firmware.osu) {
      transitionTo("finish");
      return;
    }
    // This whole flow is still not a device action. The step originally would only send
    // the firmware update payload to the device whereas now we are backing up the CLS too
    // but only for stax.
    const deviceId = device ? device.deviceId : "";
    const maybeCLSBackup =
      deviceModelId === DeviceModelId.stax
        ? staxFetchImage({ deviceId, request: { allowedEmpty: true } })
        : EMPTY;

    // Allow for multiple preparation flows in this paradigm.
    const task = concat(
      maybeCLSBackup.pipe(
        catchError(e => {
          if (e instanceof UnexpectedBootloader) {
            // CLS checks fail when in recovery mode, preventing an update of an
            // unseeded device. This bypasses that check.
            return EMPTY;
          }
          throw e;
        }),
        tap((e: FetchImageEvent) => {
          // bubble up this image to the main component and keep it in memory
          if (e.type === "imageFetched") {
            setCLSBackup(e.hexImage);
          }
        }),
        map((props: FetchImageEvent) => ({
          ...props,
          step: "CLS",
        })),
      ),
      firmwareUpdatePrepare(deviceId, firmware).pipe(
        map(({ progress }: { progress: number }) => ({
          progress,
          step: "transfer",
          displayed: progress >= 0.99, // Some paths never reach 1, I'm not touching that.
        })),
      ),
    );

    const sub = (getEnv("MOCK") ? mockedEventEmitter() : task).subscribe({
      next: ({
        progress,
        displayed,
        step,
      }: {
        progress: number;
        displayed?: boolean;
        step: string;
      }) => {
        setProgress(progress);
        setDisplayedOnDevice(!!displayed);
        setStep(step);
      },
      complete: () => {
        transitionTo(
          firmware.shouldFlashMCU || hasFinalFirmware(firmware.final) ? "updateMCU" : "updating",
        );
      },
      error: (error: Error) => {
        setError(error);
        transitionTo("finish");
      },
    });

    return () => {
      if (sub) sub.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasHash = !!firmware?.osu?.hash;
  if (!firmware) return null;

  return (
    <Container data-test-id="firmware-update-download-progress">
      <TrackPage category="Manager" name="InstallFirmware" />
      <Body
        deviceModelId={deviceModelId}
        deviceInfo={deviceInfo}
        hasHash={hasHash}
        displayedOnDevice={displayedOnDevice}
        firmware={firmware}
        progress={progress}
        step={step}
      />
    </Container>
  );
};

export default StepPrepare;

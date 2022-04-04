import React, { useEffect, useCallback, useState, useReducer } from "react";
import { Trans, useTranslation } from "react-i18next";
import { StyleSheet, View, NativeModules, Linking } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { useTheme } from "styled-components/native";
import manager from "@ledgerhq/live-common/lib/manager";
import { Button, Checkbox, Flex, Text, Link, Icons } from "@ledgerhq/native-ui";
import { BackgroundEvent, nextBackgroundEventSelector } from "../../reducers/appstate";
import { clearBackgroundEvents, dequeueBackgroundEvent } from "../../actions/appstate";
import FirmwareProgress from "../FirmwareProgress";
import BottomModal from "../BottomModal";
import GenericErrorView from "../GenericErrorView";
import Animation from "../Animation";
import getDeviceAnimation from "../DeviceAction/getDeviceAnimation";
import Spinning from "../Spinning";
import BigSpinner from "../../icons/BigSpinner";
import InfoIcon from "../InfoIcon";
import Check from "../../icons/Check";
import { DeviceInfo } from "@ledgerhq/live-common/lib/types/manager";
import useLatestFirmware from "../../hooks/useLatestFirmware";
import { urls } from "../../config/urls";

type Props = {
  device: Device,
  deviceInfo: DeviceInfo,
};

type FwUpdateStep = "confirmRecoveryBackup" | "downloadingUpdate" | "error" | "flashingMcu" | "confirmPin" | "confirmUpdate" | "firmwareUpdated";
type FwUpdateState = { step: FwUpdateStep, progress?: number, error?: any }

// reducer for the firmware update state machine
const fwUpdateStateReducer = (state: FwUpdateState, event: BackgroundEvent | { type: "reset" }): FwUpdateState => {
  switch(event.type) {
    case "confirmPin":
      return { step: "confirmPin" };
    case "downloadingUpdate":
      return { step: "downloadingUpdate", progress: event.progress };
    case "confirmUpdate":
      return { step: "confirmUpdate" };
    case "flashingMcu":
      return { step: "flashingMcu" };      
    case "firmwareUpdated":
      return { step: "firmwareUpdated" };
    case "error":
      return { step: "error", error: event.error };
    case "reset":
      return { step: "confirmRecoveryBackup", error: undefined, progress: undefined };
    default:
      return { ...state }
  }
}


export default function FirmwareUpdate({ device, deviceInfo }: Props) {
  const nextBackgroundEvent = useSelector(nextBackgroundEventSelector);
  const [closed, setClosed] = useState(false);
  const dispatch = useDispatch();
  const { colors, theme } = useTheme();
  const firmware = useLatestFirmware(deviceInfo);

  const { t } = useTranslation();

  const [state, dispatchEvent] = useReducer(fwUpdateStateReducer, { step: "confirmRecoveryBackup", progress: undefined, error: undefined });

  const { step, progress, error } = state;

  const onReset = useCallback(() => {
    dispatchEvent({type: "reset"});
    dispatch(clearBackgroundEvents());
    NativeModules.BackgroundRunner.stop();
  }, [dispatch]);

  const onClose = useCallback(() => {
    if(step === "confirmRecoveryBackup" || step === "firmwareUpdated" || step === "error") {
      onReset();
      setClosed(true);
    }
  }, [onReset, setClosed]);
  console.log({ state });

  useEffect(() => {
    console.log({ nextBackgroundEvent })

    if (!nextBackgroundEvent) return;

    dispatchEvent(nextBackgroundEvent);
    dispatch(dequeueBackgroundEvent());
  }, [nextBackgroundEvent, dispatch, dispatchEvent]);


  const launchUpdate = useCallback(() => {
    if(firmware) {
      NativeModules.BackgroundRunner.start(device.deviceId, JSON.stringify(firmware));
      dispatchEvent({ type: "downloadingUpdate", progress: 0 });
    }
  }, [firmware]);

  const [confirmRecoveryPhraseBackup, setConfirmRecoveryPhraseBackup] = useState(false);

  const toggleConfirmRecoveryPhraseBackup = useCallback(() => {
    setConfirmRecoveryPhraseBackup(!confirmRecoveryPhraseBackup);
  }, [confirmRecoveryPhraseBackup]);

  const openRecoveryPhraseInfo = React.useCallback(async () => {
    // Checking if the link is supported for links with custom URL scheme.
    const supported = await Linking.canOpenURL(urls.recoveryPhraseInfo);
    console.log("supported", supported);
    if (!supported) return;

    // Opening the link with some app, if the URL scheme is "http" the web link should be opened
    // by some browser in the mobile
    await Linking.openURL(urls.recoveryPhraseInfo);
  }, [urls.recoveryPhraseInfo]);

  return (
    <BottomModal
      id="DeviceActionModal"
      isOpened={!closed}
      onClose={onClose}
      onModalHide={onClose}
    >
        {
          step === "confirmRecoveryBackup" && (
            <Flex>
              <Text variant="h2" fontWeight="semiBold">
                <Trans
                  i18nKey="FirmwareUpdateReleaseNotes.introTitle"
                  values={{ version: "2.0.2" }}
                >
                  {"You are about to install "}
                  <Text variant="h2" fontWeight="semiBold">{`firmware version ${'2.0.2'}`}</Text>
                </Trans>
              </Text>
              <Text variant="paragraph" color="neutral.c80" mt={6}>
                {t("FirmwareUpdateReleaseNotes.recoveryPhraseBackupInstructions")}
              </Text>
              <Flex mt={6}>
                <Link
                  onPress={openRecoveryPhraseInfo}
                  Icon={Icons.ExternalLinkMedium}
                  iconPosition="right"
                  type="color"
                  style={{ justifyContent: "flex-start" }}                
                >
                  {t("onboarding.stepSetupDevice.recoveryPhraseSetup.infoModal.link")}
                </Link>
              </Flex>
              <Flex height={1} mt={7} backgroundColor="neutral.c40" />
              {/** TODO: replace by divider component when we have one */}
              <Flex backgroundColor="neutral.c30" p={7} mt={12} borderRadius={5}>
                <Checkbox checked={confirmRecoveryPhraseBackup} onChange={toggleConfirmRecoveryPhraseBackup} label={t("FirmwareUpdateReleaseNotes.confirmRecoveryPhrase")} />
              </Flex>
            <Button onPress={launchUpdate} type="main" mt={8} disabled={!confirmRecoveryPhraseBackup}>
              {t("common.continue")}
            </Button>
            <Button onPress={onClose} mt={6}>
              {t("common.cancel")}
            </Button>
            </Flex>
          )
        }
        {
          step === "firmwareUpdated" && (
            <View>
              <LText style={[styles.text, styles.description]} color="grey">
                <Trans i18nKey="FirmwareUpdate.success" />
              </LText>
              <View style={{ alignItems: "center", marginTop: 20 }}>
                <InfoIcon bg={colors.success.c100}>
                  <Check color={colors.neutral.c100} size={32} />
                </InfoIcon>
              </View>
            </View>
          )
        }
        {
          step === "error" && (
            <GenericErrorView error={error} />
          )
        }
        {
          step === "confirmUpdate" && (
            <View style={{ alignItems: "center" }}>
              <LText style={[styles.text, styles.description]} color="grey">
                <Trans i18nKey="FirmwareUpdate.confirmIdentifierText" />
              </LText>
              <LText style={[styles.text, styles.description]} color="grey">
                {device &&
                  firmware?.osu &&
                  manager
                    .formatHashName(firmware?.osu.hash, device.modelId, deviceInfo)
                    .map((hash, i) => <LText key={`${i}-${hash}`}>{hash}</LText>)}
              </LText>
              <Animation
                source={getDeviceAnimation({
                  device,
                  key: "validate",
                  theme: theme as "light" | "dark" | undefined,
                })}
              />
            </View>
          )
        }
        {step === "downloadingUpdate" && (
          <View>
            <LText style={[styles.text, styles.description]} color="grey">
              <Trans
                i18nKey={"FirmwareUpdate.steps.firmware"}
              />
            </LText>
            <View style={styles.progress}>
              {progress ? (
                <FirmwareProgress progress={progress} size={60} />
              ) : (
                <View style={styles.loading}>
                  <Spinning clockwise>
                    <BigSpinner />
                  </Spinning>
                </View>
              )}
            </View>
          </View>
        )}
    </BottomModal>
  );
}

const styles = StyleSheet.create({
  progress: { marginTop: 20, alignItems: "center" },
  title: {
    textAlign: "center",
    fontSize: 18,
    marginBottom: 8,
  },
  text: {
    textAlign: "center",
  },
  description: {
    padding: 8,
  },
  closeButton: {
    height: 32,
    width: 32,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 4,
    right: 4,
  },
  loading: {},
});

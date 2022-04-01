import React, { useEffect, useCallback, useState } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View, NativeModules } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { useTheme } from "styled-components/native";
import manager from "@ledgerhq/live-common/lib/manager";
import Close from "../../icons/Close";
import Circle from "../Circle";
import Touchable from "../Touchable";
import { backgroundEventsSelector } from "../../reducers/appstate";
import { clearBackgroundEvents } from "../../actions/appstate";
import FirmwareProgress from "../FirmwareProgress";
import LText from "../LText";
import BottomModal from "../BottomModal";
import GenericErrorView from "../GenericErrorView";
import Animation from "../Animation";
import getDeviceAnimation from "../DeviceAction/getDeviceAnimation";
import { normalize } from "../../helpers/normalizeSize";
import Spinning from "../Spinning";
import BigSpinner from "../../icons/BigSpinner";
import InfoIcon from "../InfoIcon";
import Check from "../../icons/Check";

type Props = {
  device?: Device,
};


export default function FirmwareUpdate({ device }: Props) {
  const backgroundEvents = useSelector(backgroundEventsSelector);
  const [started, setStarted] = useState(false);
  const [closed, setClosed] = useState(false);
  const dispatch = useDispatch();
  const { colors, theme } = useTheme();

  // Fixme, do we need to maintain any state here?
  const [firmware, setFirmware] = useState<any>();
  const [deviceInfo, setDeviceInfo] = useState<any>();
  const [error, setError] = useState<any>();
  const [completed, setCompleted] = useState<any>();
  const [installing, setInstalling] = useState(false);
  const { displayedOnDevice, progress } = backgroundEvents[0] || {};
  const iconWidth = normalize(64);

  const onReset = useCallback(() => {
    setStarted(false);
    setFirmware(null);
    setInstalling(false);

    dispatch(clearBackgroundEvents());
    NativeModules.BackgroundRunner.stop();
  }, [dispatch]);

  const onClose = useCallback(() => {
    onReset();
    setClosed(true);
  }, [onReset]);

  const onCompleted = useCallback(() => {
    onReset();
    setCompleted(true);
  }, [onReset]);

  useEffect(() => {
    if (!backgroundEvents.length) return;
    const { type, latestFirmware, error, deviceInfo } = backgroundEvents[0];
    switch (type) {
      case "deviceInfo":
        setDeviceInfo(deviceInfo);
        break;
      case "latestFirmware":
        setFirmware(latestFirmware);
        break;
      case "installing":
        setInstalling(true);
        break;
      case "error":
        setError(error);
        break;
      case "completed":
        onCompleted();
        break;
      default:
        break;
    }
  }, [backgroundEvents, onCompleted]);

  useEffect(() => {
    // Start the update as soon as we have a device, only if it's not already started
    if (device && !started && !error && !completed) {
      setStarted(true);
      NativeModules.BackgroundRunner.start(device.deviceId, false);
    }
  }, [completed, device, error, started]);
  const canCloseModal = error || completed;

  return (
    <BottomModal
      id="DeviceActionModal"
      preventBackdropClick={!canCloseModal}
      isOpened={!!device && !closed}
      onClose={onClose}
      onModalHide={onClose}
    >
      <View style={styles.bottom}>
        {canCloseModal ? (
          <Touchable
            event="FirmwareUpdateCloseButton"
            onPress={onClose}
            style={styles.closeButton}
          >
            <Circle size={iconWidth / 2} bg={colors.primary.c80}>
              <Close />
            </Circle>
          </Touchable>
        ) : null}
        <LText style={[styles.text, styles.title]} semiBold>
          <Trans i18nKey="FirmwareUpdate.drawerUpdate.title" />
        </LText>

        {completed ? (
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
        ) : error ? (
          <GenericErrorView error={error} />
        ) : !displayedOnDevice ? (
          <View>
            <LText style={[styles.text, styles.description]} color="grey">
              <Trans
                i18nKey={
                  !progress
                    ? "FirmwareUpdate.preparing"
                    : installing
                    ? "FirmwareUpdate.steps.firmware"
                    : "FirmwareUpdate.steps.flash"
                }
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
        ) : (
          <View style={{ alignItems: "center" }}>
            <LText style={[styles.text, styles.description]} color="grey">
              <Trans i18nKey="FirmwareUpdate.confirmIdentifierText" />
            </LText>
            <LText style={[styles.text, styles.description]} color="grey">
              {device &&
                firmware.osu &&
                manager
                  .formatHashName(firmware.osu.hash, device.modelId, deviceInfo)
                  .map((hash, i) => <LText key={`${i}-${hash}`}>{hash}</LText>)}
            </LText>
            <Animation
              source={getDeviceAnimation({
                device,
                key: "validate",
                theme,
              })}
            />
          </View>
        )}
      </View>
    </BottomModal>
  );
}

const styles = StyleSheet.create({
  bottom: {
    padding: 20,
  },
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

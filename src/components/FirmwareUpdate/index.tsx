import React, { useEffect, useCallback, useState } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View, NativeModules } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { useTheme } from "styled-components/native";
import manager from "@ledgerhq/live-common/lib/manager";
import { Button } from "@ledgerhq/native-ui";
import { nextBackgroundEventSelector } from "../../reducers/appstate";
import { clearBackgroundEvents, dequeueBackgroundEvent } from "../../actions/appstate";
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
import useStateMachine, { t } from "@cassiozen/usestatemachine";
import { DeviceInfo } from "@ledgerhq/live-common/lib/types/manager";
import useLatestFirmware from "../../hooks/useLatestFirmware";

type Props = {
  device: Device,
  deviceInfo: DeviceInfo,
};


export default function FirmwareUpdate({ device, deviceInfo }: Props) {
  const nextBackgroundEvent = useSelector(nextBackgroundEventSelector);
  const [closed, setClosed] = useState(false);
  const dispatch = useDispatch();
  const { colors, theme } = useTheme();
  const firmware = useLatestFirmware(deviceInfo);

  // Fixme, do we need to maintain any state here?
  const iconWidth = normalize(64);

  const [state, send] = useStateMachine({
    schema: {
      context: t<{ progress: number, error?: string }>(),
      events:  {
        progress: t<{ value: number }>(),
        error: t<{ value: string }>(),
      }
    },
    context: { progress: 0 },
    initial: "confirmRecoveryBackup",
    states: {
      confirmRecoveryBackup: {
        	on: {
            next: "downloadingUpdate",
            error: "error",
            reset: "confirmRecoveryBackup"
          },
          effect({ setContext }) {
            setContext(_ => ({ error: undefined, progress: 0 }));
          }
      },
      downloadingUpdate: {
        on: {
          next: "confirmUpdateDownloadOnDevice",
          error: "error",
          progress: "downloadingUpdate",
          reset: "confirmRecoveryBackup"
        },
        effect({ setContext, event }) {
          if(event.type === "progress") {
            setContext(context => ({ ...context, progress: event.value }));
          }
        }
      },
      confirmUpdateDownloadOnDevice: {
        on: {
          next: "bootloaderUpdating",
          error: "error",
          reset: "confirmRecoveryBackup"
        }
      },
      bootloaderUpdating: {
        on: {
          next: "mcuUpdating",
          error: "error",
          reset: "confirmRecoveryBackup"
        }
      },
      mcuUpdating: {
        on: {
          next: "confirmUpdateInstallOnDevice",
          error: "error",
          reset: "confirmRecoveryBackup"
        }
      },
      confirmUpdateInstallOnDevice: {
        on: {
          next: "firmwareUpdated",
          error: "error",
          reset: "confirmRecoveryBackup"
        }
      },
      firmwareUpdated: {
        on: {
          reset: "confirmRecoveryBackup"
        }
      },
      error: {
        on: {
          reset: "confirmRecoveryBackup"
        },
        effect({ setContext, event }) {
          setContext(context => ({ ...context, error: event.value }));
        }
      }
    }
  });

  const { progress, error } = state.context;

  const onReset = useCallback(() => {
    send("reset");
    dispatch(clearBackgroundEvents());
    NativeModules.BackgroundRunner.stop();
  }, [dispatch]);

  const onClose = useCallback(() => {
    if(state.value === "confirmRecoveryBackup" || state.value === "firmwareUpdated" || state.value === "error") {
      onReset();
      setClosed(true);
    }
  }, [onReset, setClosed]);
  console.log({ state: state.value })

  useEffect(() => {
    console.log({ nextBackgroundEvent })

    if (!nextBackgroundEvent) return;

    const { type } = nextBackgroundEvent;
    switch (type) {
      case "completed":
        send("next");
        break;
      case "error":
        send({ type: "error", value: nextBackgroundEvent.error });
        break;
      case "progress":
        send({ type: "progress", value: nextBackgroundEvent.progress ?? 0 });
        break;
      default:
        break;
    }

    dispatch(dequeueBackgroundEvent());
  }, [nextBackgroundEvent, send]);


  const launchUpdate = useCallback(() => {
    if(firmware) {
      NativeModules.BackgroundRunner.start(device.deviceId, JSON.stringify(firmware));
      send("next");
    }
  }, [firmware]);


  return (
    <BottomModal
      id="DeviceActionModal"
      isOpened={!closed}
      onClose={onClose}
      onModalHide={onClose}
    >
      <View style={styles.bottom}>        
        <LText style={[styles.text, styles.title]} semiBold>
          <Trans i18nKey="FirmwareUpdate.drawerUpdate.title" />
        </LText>
        {
          state.value === "confirmRecoveryBackup" && (
            <Button onPress={launchUpdate}>
              {"Vamo dalhe"}
            </Button>
          )
        }
        {
          state.value === "firmwareUpdated" && (
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
          state.value === "error" && (
            <GenericErrorView error={error} />
          )
        }
        {
          state.value === "confirmUpdateDownloadOnDevice" && (
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
        {"downloadingUpdate" && (
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

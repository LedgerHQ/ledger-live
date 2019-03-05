/* @flow */
/* eslint-disable no-console */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import { translate, Trans } from "react-i18next";
import firmwareUpdatePrepare from "@ledgerhq/live-common/lib/hw/firmwareUpdate-prepare";
import type { FirmwareUpdateContext } from "@ledgerhq/live-common/lib/types/manager";
import manager from "@ledgerhq/live-common/lib/manager";
import { TrackScreen } from "../../analytics";
import { deviceNames } from "../../wording";
import colors from "../../colors";
import StepHeader from "../../components/StepHeader";
import LText from "../../components/LText";
import DeviceNanoAction from "../../components/DeviceNanoAction";
import LiveLogo from "../../icons/LiveLogoIcon";
import Spinning from "../../components/Spinning";
import FirmwareProgress from "../../components/FirmwareProgress";
import getWindowDimensions from "../../logic/getWindowDimensions";

type Navigation = NavigationScreenProp<{
  params: {
    deviceId: string,
    firmware: FirmwareUpdateContext,
  },
}>;

type Props = {
  navigation: Navigation,
};

type State = {
  progress: number,
  displayedOnDevice: boolean,
};

class FirmwareUpdateCheckId extends Component<Props, State> {
  state = {
    progress: 0,
    displayedOnDevice: false,
  };

  static navigationOptions = {
    headerLeft: null,
    headerTitle: (
      <StepHeader
        subtitle={<Trans i18nKey="FirmwareUpdate.title" />}
        title={<Trans i18nKey="FirmwareUpdateCheckId.title" />}
      />
    ),
  };

  sub: *;

  componentDidMount() {
    const { navigation } = this.props;
    const deviceId = navigation.getParam("deviceId");
    const firmware = navigation.getParam("firmware");

    if (!firmware) {
      // if there is no latest firmware we'll jump to success screen
      if (navigation.replace) {
        navigation.replace("FirmwareUpdateConfirmation", {
          ...navigation.state.params,
        });
      }
      return;
    }

    this.sub = firmwareUpdatePrepare(deviceId, firmware).subscribe({
      next: patch => {
        this.setState(patch);
      },
      complete: () => {
        if (navigation.replace) {
          navigation.replace("FirmwareUpdateMCU", {
            ...navigation.state.params,
          });
        }
      },
      error: error => {
        if (navigation.replace) {
          navigation.replace("FirmwareUpdateFailure", {
            ...navigation.state.params,
            error,
          });
        }
      },
    });
  }

  componentWillUnmount() {
    if (this.sub) this.sub.unsubscribe();
  }

  render() {
    const { navigation } = this.props;
    const { progress } = this.state;
    const { osu } = navigation.getParam("firmware");
    const windowWidth = getWindowDimensions().width;

    return (
      <SafeAreaView style={styles.root}>
        <TrackScreen category="FirmwareUpdate" name="CheckId" />
        <View style={styles.body}>
          <View style={styles.device}>
            <DeviceNanoAction
              action="accept"
              screen="validation"
              width={1.2 * windowWidth}
            />
          </View>
          <LText style={styles.description}>
            <Trans
              i18nKey="FirmwareUpdateCheckId.description"
              values={deviceNames.nanoX}
            />
          </LText>
          <View style={[styles.idContainer, { maxWidth: windowWidth - 40 }]}>
            <LText style={styles.id} bold>
              {osu && manager.formatHashName(osu.hash)}
            </LText>
          </View>

          <View style={styles.footer}>
            {progress === 0 ? (
              <View style={{ padding: 10 }}>
                <Spinning>
                  <LiveLogo color={colors.fog} size={40} />
                </Spinning>
              </View>
            ) : (
              <FirmwareProgress progress={progress} size={60} />
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  body: {
    padding: 20,
    flex: 1,
    alignItems: "center",
  },
  footer: {
    paddingTop: 50,
  },
  device: {
    left: "25%",
    position: "relative",
  },
  description: {
    color: colors.smoke,
    fontSize: 14,
    marginVertical: 30,
  },
  idContainer: {
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.fog,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  id: {
    fontSize: 16,
  },
});

export default translate()(FirmwareUpdateCheckId);

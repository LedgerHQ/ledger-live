/* @flow */
/* eslint-disable no-console */
import React, { Component } from "react";
import { View, Dimensions, StyleSheet } from "react-native";
import { SafeAreaView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import { translate, Trans } from "react-i18next";
import firmwareUpdatePrepare from "@ledgerhq/live-common/lib/hw/firmwareUpdate-prepare";
import type {
  OsuFirmware,
  FinalFirmware,
} from "@ledgerhq/live-common/lib/types/manager";
import manager from "@ledgerhq/live-common/lib/manager";
import { TrackScreen } from "../../analytics";
import { deviceNames } from "../../wording";
import colors from "../../colors";
import StepHeader from "../../components/StepHeader";
import LText from "../../components/LText";
import DeviceNanoAction from "../../components/DeviceNanoAction";

type Navigation = NavigationScreenProp<{
  params: {
    deviceId: string,
    osu: ?OsuFirmware,
    final: ?FinalFirmware,
  },
}>;

type Props = {
  navigation: Navigation,
};

type State = {
  progress: number,
};

class FirmwareUpdateCheckId extends Component<Props, State> {
  state = {
    progress: 0,
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
    const osu = navigation.getParam("osu");

    if (!osu) {
      // if there is no latest firmware we'll jump to success screen
      if (navigation.replace) {
        navigation.replace("FirmwareUpdateConfirmation", {
          ...navigation.state.params,
        });
      }
      return;
    }

    this.sub = firmwareUpdatePrepare(deviceId, osu).subscribe({
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
    const osu = navigation.getParam("osu");
    const windowWidth = Dimensions.get("window").width;

    // TODO what to do with the progress state ?

    return (
      <SafeAreaView style={styles.root}>
        <TrackScreen category="FirmwareUpdate" name="CheckId" />
        <View style={styles.body}>
          <View style={styles.device}>
            <DeviceNanoAction
              powerAction
              action
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

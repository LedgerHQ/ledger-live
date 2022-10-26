import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trans } from "react-i18next";
import firmwareUpdatePrepare from "@ledgerhq/live-common/hw/firmwareUpdate-prepare";
import manager from "@ledgerhq/live-common/manager/index";
import { Subscription } from "rxjs";
import { TrackScreen } from "../../analytics";
import { deviceNames } from "../../wording";
import { ScreenName } from "../../const";
import LText from "../../components/LText";
import DeviceNanoAction from "../../components/DeviceNanoAction";
import LiveLogo from "../../icons/LiveLogoIcon";
import Spinning from "../../components/Spinning";
import DeviceActionProgress from "../../components/DeviceActionProgress";
import getWindowDimensions from "../../logic/getWindowDimensions";
import { withTheme, Theme } from "../../colors";
import type { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import type { FirmwareUpdateNavigatorParamList } from "../../components/RootNavigator/types/FirmwareUpdateNavigator";

type Navigation = StackNavigatorProps<
  FirmwareUpdateNavigatorParamList,
  ScreenName.FirmwareUpdateCheckId
>;

type Props = {
  colors: Theme["colors"];
} & Navigation;

type State = {
  progress: number;
  displayedOnDevice: boolean;
};

class FirmwareUpdateCheckId extends Component<Props, State> {
  state = {
    progress: 0,
    displayedOnDevice: false,
  };
  sub: Subscription | undefined;

  componentDidMount() {
    const { navigation, route } = this.props;
    const { deviceId, firmware } = route.params || {};

    if (!firmware) {
      // if there is no latest firmware we'll jump to success screen
      if (navigation.replace) {
        navigation.replace(ScreenName.FirmwareUpdateConfirmation, route.params);
      }

      return;
    }

    this.sub = firmwareUpdatePrepare(deviceId, firmware).subscribe({
      next: patch => {
        this.setState(patch);
      },
      complete: () => {
        if (navigation.replace) {
          navigation.replace(ScreenName.FirmwareUpdateMCU, route.params);
        }
      },
      error: error => {
        if (navigation.replace) {
          navigation.replace(ScreenName.FirmwareUpdateFailure, {
            ...route.params,
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
    const { colors } = this.props;
    const { progress } = this.state;
    const { osu } = this.props.route.params?.firmware;
    const windowWidth = getWindowDimensions().width;
    return (
      <SafeAreaView
        style={[
          styles.root,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <TrackScreen category="FirmwareUpdate" name="CheckId" />
        <View style={styles.body}>
          <View style={styles.device}>
            <DeviceNanoAction
              action="accept"
              screen="validation"
              width={1.2 * windowWidth}
            />
          </View>
          <LText style={styles.description} color="smoke">
            <Trans
              i18nKey="FirmwareUpdateCheckId.description"
              values={deviceNames.nanoX}
            />
          </LText>
          <View
            style={[
              styles.idContainer,
              {
                borderColor: colors.fog,
                maxWidth: windowWidth - 40,
              },
            ]}
          >
            {osu &&
              manager.formatHashName(osu.hash).map(hash => (
                <LText key={hash} style={styles.id} bold>
                  {hash}
                </LText>
              ))}
          </View>

          <View style={styles.footer}>
            {progress === 0 ? (
              <View
                style={{
                  padding: 10,
                }}
              >
                <Spinning>
                  <LiveLogo color={colors.grey} size={40} />
                </Spinning>
              </View>
            ) : (
              <DeviceActionProgress progress={progress} />
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
    fontSize: 14,
    marginVertical: 30,
  },
  idContainer: {
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: "dashed",
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  id: {
    fontSize: 16,
  },
});
export default withTheme(FirmwareUpdateCheckId);

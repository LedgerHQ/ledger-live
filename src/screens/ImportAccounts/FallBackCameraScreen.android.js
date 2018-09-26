/* @flow */
import React, { PureComponent } from "react";
import { translate, Trans } from "react-i18next";
import { View, StyleSheet, AppState } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import OpenSettings from "react-native-open-settings";
import i18next from "i18next";
import Icon from "react-native-vector-icons/dist/Feather";
import colors from "../../colors";
import type { T } from "../../types/common";
import LText from "../../components/LText";
import Button from "../../components/Button";
import HeaderRightClose from "../../components/HeaderRightClose";
import FallbackCamera from "../../icons/FallbackCamera";

type Props = {
  navigation: NavigationScreenProp<*>,
  t: T,
};
type State = {
  appSTate: string,
  openSettingsPressed: boolean,
};
class FallBackCameraScreen extends PureComponent<Props, State> {
  state = {
    appState: AppState.currentState,
    openSettingsPressed: false,
  };

  static navigationOptions = ({
    navigation,
  }: {
    navigation: NavigationScreenProp<*>,
  }) => ({
    title: i18next.t("account.import.fallback.header"),
    headerRight: (
      <HeaderRightClose
        // $FlowFixMe
        navigation={navigation.dangerouslyGetParent()}
        color={colors.grey}
      />
    ),
    headerLeft: null,
  });

  componentDidMount() {
    AppState.addEventListener("change", this.handleAppStateChange);
  }

  componentWillUnmount() {
    AppState.removeEventListener("change", this.handleAppStateChange);
  }

  handleAppStateChange = nextAppState => {
    const { appState, openSettingsPressed } = this.state;
    const { navigation } = this.props;
    if (
      appState.match(/inactive|background/) &&
      nextAppState === "active" &&
      openSettingsPressed
    ) {
      navigation.replace("ScanAccounts");
    }
    this.setState({ appState: nextAppState });
  };

  openNativeSettings = () => {
    this.setState({ openSettingsPressed: true });
    OpenSettings.openSettings();
  };

  render() {
    const { t } = this.props;
    return (
      <View style={styles.root}>
        <View style={styles.body}>
          <FallbackCamera />
          <LText secondary bold style={styles.title}>
            {t("account.import.fallback.title")}
          </LText>
          <LText style={styles.desc}>
            <Trans i18nKey="account.import.fallback.descAndroid">
              {"To import account, Ledger Live needs to"}
              <LText bold style={styles.descBold}>
                {"access your camera"}
              </LText>
              {"You’ll be taken to Android settings to activate it"}
            </Trans>
          </LText>
          <Button
            type="primary"
            title={t("account.import.fallback.buttonAndroid")}
            onPress={this.openNativeSettings}
            containerStyle={styles.buttonContainer}
            iconLeft={IconSettings}
          />
        </View>
      </View>
    );
  }
}

const IconSettings = ({ size, color }: { size: number, color: string }) => (
  <Icon name="settings" size={size} color={color} />
);

export default translate()(FallBackCameraScreen);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    alignItems: "center",
  },
  title: {
    marginTop: 40,
    marginBottom: 16,
    fontSize: 16,
  },
  desc: {
    color: colors.grey,
    marginHorizontal: 40,
    textAlign: "center",
    marginBottom: 48,
  },
  descBold: {
    color: colors.black,
  },
  buttonContainer: {
    width: 290,
  },
});

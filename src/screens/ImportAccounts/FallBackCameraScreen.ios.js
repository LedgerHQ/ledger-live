/* @flow */
import React, { PureComponent } from "react";
import { translate, Trans } from "react-i18next";
import { View, StyleSheet, Linking } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import i18next from "i18next";
import Icon from "react-native-vector-icons/dist/Feather";
import colors from "../../colors";
import type { T } from "../../types/common";
import LText from "../../components/LText";
import Button from "../../components/Button";
import HeaderRightClose from "../../components/HeaderRightClose";
import FallbackCamera from "../../icons/FallbackCamera";

class FallBackCameraScreen extends PureComponent<{
  navigation: NavigationScreenProp<*>,
  t: T,
}> {
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

  openNativeSettings = () => {
    Linking.openURL("app-settings:");
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
            <Trans i18nKey="account.import.fallback.descIOS">
              {"To import account, Ledger Live needs to"}
              <LText bold style={styles.descBold}>
                {"access your camera"}
              </LText>
              {"You’ll be taken to iOS settings to activate it"}
            </Trans>
          </LText>
          <Button
            type="primary"
            title={t("account.import.fallback.buttonIOS")}
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

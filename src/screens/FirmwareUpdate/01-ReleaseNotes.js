/* @flow */
import React, { Component, PureComponent } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import Markdown from "react-native-easy-markdown";
import { translate, Trans } from "react-i18next";
import i18next from "i18next";

import { TrackPage } from "../../analytics";
import manager from "../../logic/manager";
import type { Firmware } from "../../types/manager";
import Button from "../../components/Button";
import LText, { getFontStyle } from "../../components/LText";
import colors from "../../colors";

type Navigation = NavigationScreenProp<{
  params: {
    deviceId: string,
    latestFirmware: ?Firmware,
  },
}>;

type Props = {
  navigation: Navigation,
};

type State = {};

class FirmwareUpdateReleaseNotes extends Component<Props, State> {
  static navigationOptions = {
    headerTitle: i18next.t("FirmwareUpdate.title"),
  };

  onNext = () => {
    const { navigation } = this.props;
    navigation.navigate("FirmwareUpdateCheckId", {
      ...navigation.state.params,
    });
  };

  render() {
    const { navigation } = this.props;
    const latestFirmware = navigation.getParam("latestFirmware");
    if (!latestFirmware) return null;
    const version = manager.getFirmwareVersion(latestFirmware);
    return (
      <SafeAreaView style={styles.root}>
        <TrackPage category="FirmwareUpdate" name="ReleaseNotes" />
        <ScrollView style={styles.body} contentContainerStyle={styles.content}>
          <LText style={styles.intro}>
            <Trans
              i18nKey="FirmwareUpdateReleaseNotes.introTitle"
              values={{ version }}
            >
              {"You are about to install "}
              <LText semiBold>firmware version {version}.</LText>
            </Trans>
            {"\n\n"}
            <Trans i18nKey="FirmwareUpdateReleaseNotes.introDescription1" />{" "}
            <LText semiBold>
              <Trans i18nKey="FirmwareUpdateReleaseNotes.introDescription2" />
            </LText>
          </LText>
          {latestFirmware.notes ? (
            <View style={styles.markdownSection}>
              <SafeMarkdown markdown={latestFirmware.notes} />
            </View>
          ) : null}
        </ScrollView>
        <View style={styles.footer}>
          <Button
            event="FirmwareUpdateReleaseNotesContinue"
            type="primary"
            onPress={this.onNext}
            title={<Trans i18nKey="FirmwareUpdateReleaseNotes.action" />}
          />
        </View>
      </SafeAreaView>
    );
  }
}

class SafeMarkdown extends PureComponent<
  { markdown: string },
  { error: ?Error },
> {
  state = {
    error: null,
  };

  componentDidCatch(error) {
    this.setState({ error });
  }

  render() {
    const { markdown } = this.props;
    const { error } = this.state;
    if (error) {
      return <LText style={markdownStyles.text}>{markdown}</LText>; // :(
    }
    return <Markdown markdownStyles={markdownStyles}>{markdown}</Markdown>;
  }
}

const markdownStyles = StyleSheet.create({
  text: {
    ...getFontStyle(),
    color: colors.darkBlue,
    fontSize: 14,
  },
  strong: {
    ...getFontStyle({ semiBold: true }),
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  body: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  intro: {
    fontSize: 14,
    color: colors.darkBlue,
  },
  markdownSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderColor: colors.lightFog,
  },
  footer: {
    backgroundColor: colors.white,
    padding: 16,
  },
});

export default translate()(FirmwareUpdateReleaseNotes);

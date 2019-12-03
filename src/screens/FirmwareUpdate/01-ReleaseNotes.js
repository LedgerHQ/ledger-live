/* @flow */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
// $FlowFixMe
import { SafeAreaView, ScrollView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import { translate, Trans } from "react-i18next";
import i18next from "i18next";

import manager from "@ledgerhq/live-common/lib/manager";
import type { FirmwareUpdateContext } from "@ledgerhq/live-common/lib/types/manager";
import { TrackScreen } from "../../analytics";
import Button from "../../components/Button";
import SafeMarkdown from "../../components/SafeMarkdown";
import LText from "../../components/LText";
import colors from "../../colors";

const forceInset = { bottom: "always" };

type Navigation = NavigationScreenProp<{
  params: {
    deviceId: string,
    firmware: FirmwareUpdateContext,
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
    const firmware = navigation.getParam("firmware");
    if (!firmware) return null;
    const { osu } = firmware;
    const version = manager.getFirmwareVersion(osu);
    return (
      <SafeAreaView style={styles.root} forceInset={forceInset}>
        <TrackScreen category="FirmwareUpdate" name="ReleaseNotes" />
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
          {osu.notes ? (
            <View style={styles.markdownSection}>
              <SafeMarkdown markdown={osu.notes} />
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

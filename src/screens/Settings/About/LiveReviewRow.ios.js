/* @flow */
import React, { PureComponent } from "react";
import { Linking } from "react-native";
import { Trans } from "react-i18next";
import Icon from "react-native-vector-icons/dist/FontAwesome";
import SettingsRow from "../../../components/SettingsRow";
import Circle from "../../../components/Circle";
import colors from "../../../colors";

class LiveReviewRow extends PureComponent<*> {
  render() {
    return (
      <SettingsRow
        title={<Trans i18nKey="settings.about.liveReview.title" />}
        desc={<Trans i18nKey="settings.about.liveReview.ios" />}
        iconLeft={
          <Circle bg={colors.lightLive} size={32}>
            <Icon name="apple" size={16} color={colors.live} />
          </Circle>
        }
        onPress={() => {
          Linking.openURL(
            `itms-apps://itunes.apple.com/WebObjects/MZStore.woa/wa/viewContentsUserReviews?id=1361671700&onlyLatestVersion=true&pageNumber=0&sortOrdering=1&type=Purple+Software`,
          );
        }}
      />
    );
  }
}

export default LiveReviewRow;

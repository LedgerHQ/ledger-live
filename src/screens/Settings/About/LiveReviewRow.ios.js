/* @flow */
import React, { PureComponent } from "react";
import { Linking } from "react-native";
import { translate } from "react-i18next";
import Icon from "react-native-vector-icons/dist/FontAwesome";
import SettingsRow from "../../../components/SettingsRow";
import type { T } from "../../../types/common";
import Circle from "../../../components/Circle";
import colors from "../../../colors";

class LiveReviewRow extends PureComponent<{
  t: T,
}> {
  render() {
    const { t } = this.props;
    return (
      <SettingsRow
        title={t("settings.about.liveReview.title")}
        desc={t("settings.about.liveReview.ios")}
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

export default translate()(LiveReviewRow);

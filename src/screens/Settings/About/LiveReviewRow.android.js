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
        desc={t("settings.about.liveReview.android")}
        iconLeft={
          <Circle bg={colors.lightLive} size={32}>
            <Icon name="android" size={16} color={colors.live} />
          </Circle>
        }
        onPress={() => {
          Linking.openURL(
            `https://play.google.com/store/apps/details?id=com.google.android.apps.live`,
          );
        }}
      />
    );
  }
}

export default translate()(LiveReviewRow);

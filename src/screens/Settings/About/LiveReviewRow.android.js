/* @flow */
import React, { PureComponent } from "react";
import { Linking } from "react-native";
import { Trans } from "react-i18next";
import Icon from "react-native-vector-icons/dist/FontAwesome";
import SettingsRow from "../../../components/SettingsRow";
import Circle from "../../../components/Circle";
import colors from "../../../colors";
import { urls } from "../../../config/urls";

class LiveReviewRow extends PureComponent<*> {
  render() {
    return (
      <SettingsRow
        event="LiveReviewRow"
        title={<Trans i18nKey="settings.about.liveReview.title" />}
        desc={<Trans i18nKey="settings.about.liveReview.android" />}
        iconLeft={
          <Circle bg={colors.lightLive} size={32}>
            <Icon name="android" size={16} color={colors.live} />
          </Circle>
        }
        onPress={() => {
          Linking.openURL(urls.playstore);
        }}
      />
    );
  }
}

export default LiveReviewRow;

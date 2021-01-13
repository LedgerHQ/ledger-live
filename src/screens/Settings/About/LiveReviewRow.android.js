/* @flow */
import React, { memo } from "react";
import { Linking } from "react-native";
import { Trans } from "react-i18next";
import Icon from "react-native-vector-icons/dist/FontAwesome";
import { useTheme } from "@react-navigation/native";
import SettingsRow from "../../../components/SettingsRow";
import Circle from "../../../components/Circle";
import { urls } from "../../../config/urls";

function LiveReviewRow() {
  const { colors } = useTheme();
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

export default memo<*>(LiveReviewRow);

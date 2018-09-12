/* @flow */
import React, { PureComponent } from "react";
import { Linking } from "react-native";
import { translate } from "react-i18next";
import SettingsRow from "../../../components/SettingsRow";
import type { T } from "../../../types/common";

class LiveReviewRow extends PureComponent<{
  t: T,
}> {
  render() {
    const { t } = this.props;
    return (
      <SettingsRow
        title={t("common:settings.about.liveReview")}
        desc={null}
        arrowRight
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

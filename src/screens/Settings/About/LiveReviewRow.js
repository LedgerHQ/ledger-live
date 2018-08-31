/* @flow */
import React, { PureComponent } from "react";
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
          console.log("Set up deep linking with App store"); // eslint-disable-line no-console
        }}
      />
    );
  }
}

export default translate()(LiveReviewRow);

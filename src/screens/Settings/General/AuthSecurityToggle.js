/* @flow */
import React, { Component, Fragment } from "react";
import { createStructuredSelector } from "reselect";
import { Switch } from "react-native";
import { connect } from "react-redux";
import { Trans } from "react-i18next";
import { privacySelector } from "../../../reducers/settings";
import SettingsRow from "../../../components/SettingsRow";
import type { T } from "../../../types/common";
import type { Privacy } from "../../../reducers/settings";
import BiometricsRow from "./BiometricsRow";

type Props = {
  privacy: ?Privacy,
  navigation: *,
  t: T,
};

const mapStateToProps = createStructuredSelector({
  privacy: privacySelector,
});

class AuthSecurityToggle extends Component<Props> {
  onValueChange = (authSecurityEnabled: boolean) => {
    const { navigation } = this.props;
    if (authSecurityEnabled) {
      navigation.navigate("PasswordAdd");
    } else {
      navigation.navigate("PasswordRemove");
    }
  };

  render() {
    const { privacy } = this.props;
    return (
      <Fragment>
        <SettingsRow
          event="AuthSecurityToggle"
          title={<Trans i18nKey="settings.display.password" />}
          desc={<Trans i18nKey="settings.display.passwordDesc" />}
          alignedTop
        >
          <Switch value={!!privacy} onValueChange={this.onValueChange} />
        </SettingsRow>
        {privacy ? <BiometricsRow /> : null}
      </Fragment>
    );
  }
}

export default connect(mapStateToProps)(AuthSecurityToggle);

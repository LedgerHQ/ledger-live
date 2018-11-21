/* @flow */
import React, { Component, Fragment } from "react";
import { createStructuredSelector } from "reselect";
import { Switch } from "react-native";
import { connect } from "react-redux";
import { Trans } from "react-i18next";
import { disablePrivacy } from "../../../actions/settings";
import { privacySelector } from "../../../reducers/settings";
import SettingsRow from "../../../components/SettingsRow";
import type { T } from "../../../types/common";
import type { Privacy } from "../../../reducers/settings";
import BiometricsRow from "./BiometricsRow";

type Props = {
  privacy: ?Privacy,
  disablePrivacy: ($Shape<Privacy>) => void,
  navigation: *,
  t: T,
};

const mapStateToProps = createStructuredSelector({
  privacy: privacySelector,
});

const mapDispatchToProps = {
  disablePrivacy,
};

class AuthSecurityToggle extends Component<Props> {
  onValueChange = (authSecurityEnabled: boolean) => {
    const { navigation, disablePrivacy } = this.props;
    if (authSecurityEnabled) {
      return navigation.navigate("PasswordAdd");
    } else {
      // TODO instead we need to confirm we want to disable privacy
      return disablePrivacy();
    }
  };

  render() {
    const { privacy } = this.props;
    return (
      <Fragment>
        <SettingsRow
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

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(AuthSecurityToggle);

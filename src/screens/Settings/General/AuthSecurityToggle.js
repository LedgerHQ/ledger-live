/* @flow */
import React, { Component, Fragment } from "react";
import { createStructuredSelector } from "reselect";
import { Switch } from "react-native";
import { connect } from "react-redux";
import { Trans } from "react-i18next";
import { setPrivacy } from "../../../actions/settings";
import { privacySelector } from "../../../reducers/settings";
import SettingsRow from "../../../components/SettingsRow";
import type { T } from "../../../types/common";
import type { Privacy } from "../../../reducers/settings";
import BiometricsRow from "./BiometricsRow";

type Props = {
  privacy: Privacy,
  setPrivacy: ($Shape<Privacy>) => void,
  navigation: *,
  t: T,
};

const mapStateToProps = createStructuredSelector({
  privacy: privacySelector,
});

const mapDispatchToProps = {
  setPrivacy,
};

class AuthSecurityToggle extends Component<Props> {
  onValueChange = (authSecurityEnabled: boolean) => {
    const { navigation, setPrivacy } = this.props;
    if (authSecurityEnabled) {
      return navigation.navigate("PasswordAdd");
    }
    return setPrivacy({
      authSecurityEnabled,
      biometricsEnabled: false,
    });
  };

  render() {
    const { privacy } = this.props;
    return (
      <Fragment>
        <SettingsRow
          title={<Trans i18nKey="common:settings.display.password" />}
          desc={<Trans i18nKey="common:settings.display.passwordDesc" />}
          alignedTop
        >
          <Switch
            value={privacy.authSecurityEnabled}
            onValueChange={this.onValueChange}
          />
        </SettingsRow>
        {privacy.authSecurityEnabled && <BiometricsRow />}
      </Fragment>
    );
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(AuthSecurityToggle);

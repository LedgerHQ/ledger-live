/* @flow */
import React, { Component, Fragment } from "react";
import { createStructuredSelector } from "reselect";
import { Switch, Alert } from "react-native";
import { connect } from "react-redux";
import { compose } from "redux";
import { translate, Trans } from "react-i18next";
import type { T } from "../../../types/common";
import { setPrivacyBiometrics } from "../../../actions/settings";
import { privacySelector } from "../../../reducers/settings";
import type { Privacy } from "../../../reducers/settings";
import auth from "../../../context/AuthPass/auth";
import SettingsRow from "../../../components/SettingsRow";

type Props = {
  privacy: ?Privacy,
  setPrivacyBiometrics: boolean => *,
  iconLeft: *,
  t: T,
};
type State = {
  validationPending: boolean,
};

const mapStateToProps = createStructuredSelector({
  privacy: privacySelector,
});

const mapDispatchToProps = {
  setPrivacyBiometrics,
};

class BiometricsRow extends Component<Props, State> {
  state = {
    validationPending: false,
  };

  onValueChange = async (biometricsEnabled: boolean) => {
    const { t } = this.props;
    if (this.state.validationPending) return;
    if (biometricsEnabled) {
      this.setState({ validationPending: true });
      let success = false;
      let error;
      try {
        success = await auth(t("auth.failed.biometrics.authenticate"));
      } catch (e) {
        error = e;
      }
      this.setState({ validationPending: false });
      if (!success) {
        Alert.alert(
          t("auth.failed.title"),
          `${t("auth.failed.denied")}\n${String(error || "")}`,
        );
        return;
      }
    }
    this.props.setPrivacyBiometrics(biometricsEnabled);
  };

  render() {
    const { privacy, iconLeft } = this.props;
    const { validationPending } = this.state;
    if (!privacy) return null;
    return (
      <Fragment>
        {privacy.biometricsType && (
          <SettingsRow
            event="BiometricsRow"
            iconLeft={iconLeft}
            title={
              <Trans
                i18nKey="auth.enableBiometrics.title"
                values={{
                  ...privacy,
                  biometricsType: privacy.biometricsType,
                }}
              />
            }
            desc={
              <Trans
                i18nKey="auth.enableBiometrics.desc"
                values={{
                  ...privacy,
                  biometricsType: privacy.biometricsType,
                }}
              />
            }
          >
            <Switch
              value={privacy.biometricsEnabled || validationPending}
              onValueChange={this.onValueChange}
            />
          </SettingsRow>
        )}
      </Fragment>
    );
  }
}

export default compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  translate(),
)(BiometricsRow);

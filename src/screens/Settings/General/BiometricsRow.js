/* @flow */
import React, { Component } from "react";
import { createStructuredSelector } from "reselect";
import { Switch, Alert } from "react-native";
import { connect } from "react-redux";
import { compose } from "redux";
import { translate, Trans } from "react-i18next";
import type { T } from "../../../types/common";
import { setPrivacyBiometrics } from "../../../actions/settings";
import { privacySelector } from "../../../reducers/settings";
import type { Privacy } from "../../../reducers/settings";
import SettingsRow from "../../../components/SettingsRow";
import RequestBiometricModal from "../../../components/RequestBiometricModal";

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
    if (this.state.validationPending) return;
    if (biometricsEnabled) {
      this.setState({ validationPending: true });
    } else {
      this.props.setPrivacyBiometrics(false);
    }
  };

  onSuccess = () => {
    this.setState({ validationPending: false });
    this.props.setPrivacyBiometrics(true);
  };

  onError = error => {
    const { t } = this.props;
    this.setState({ validationPending: false });
    Alert.alert(
      t("auth.failed.title"),
      `${t("auth.failed.denied")}\n${String(error || "")}`,
    );
  };

  onCancel = () => {
    this.setState({ validationPending: false });
  };

  render() {
    const { privacy, iconLeft } = this.props;
    const { validationPending } = this.state;
    if (!privacy) return null;

    return (
      <>
        {privacy.biometricsType && (
          <>
            <SettingsRow
              event="BiometricsRow"
              iconLeft={iconLeft}
              centeredIcon
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
            <RequestBiometricModal
              isVisible={validationPending}
              onSuccess={this.onSuccess}
              onError={this.onError}
              onCancel={this.onCancel}
            />
          </>
        )}
      </>
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

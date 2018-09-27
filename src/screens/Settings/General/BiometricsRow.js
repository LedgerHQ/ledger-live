/* @flow */
import React, { Component, Fragment } from "react";
import { createStructuredSelector } from "reselect";
import { Switch, Alert } from "react-native";
import { connect } from "react-redux";
import { compose } from "redux";
import { translate } from "react-i18next";
import { setPrivacy } from "../../../actions/settings";
import { privacySelector } from "../../../reducers/settings";
import type { Privacy } from "../../../reducers/settings";
import auth from "../../../context/AuthPass/auth";
import SettingsRow from "../../../components/SettingsRow";
import type { T } from "../../../types/common";
import biometry from "../../../context/AuthPass/methods/biometry";

type Props = {
  privacy: Privacy,
  setPrivacy: ($Shape<Privacy>) => void,
  t: T,
};
type State = {
  validationPending: boolean,
  biometrySupported: boolean,
};

const mapStateToProps = createStructuredSelector({
  privacy: privacySelector,
});

const mapDispatchToProps = {
  setPrivacy,
};

class BiometricsRow extends Component<Props, State> {
  state = {
    validationPending: false,
    biometrySupported: false,
  };

  componentDidMount() {
    return this.checkForBiometry();
  }

  checkForBiometry() {
    biometry
      .isSupported()
      .then(() => this.setState({ biometrySupported: true }))
      .catch(() => this.setState({ biometrySupported: false }));
  }

  onValueChange = async (biometricsEnabled: boolean) => {
    if (biometricsEnabled) {
      this.setState({ validationPending: true });
      let success = false;
      let error;
      try {
        success = await auth("Please authenticate to Ledger Live app");
      } catch (e) {
        error = e;
      }
      this.setState({ validationPending: false });
      if (!success) {
        Alert.alert(
          "Authentication failed",
          `Auth Security was not enabled because your phone failed to authenticate.\n${String(
            error || "",
          )}`,
        );
        return;
      }
    }
    this.props.setPrivacy({
      biometricsEnabled,
    });
  };

  render() {
    const { t, privacy } = this.props;
    const { validationPending, biometrySupported } = this.state;
    return (
      <Fragment>
        {biometrySupported && (
          <SettingsRow
            title={t("auth.addBiometrics.title")}
            desc={t("auth.addBiometrics.desc")}
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

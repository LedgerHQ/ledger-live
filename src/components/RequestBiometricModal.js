// @flow
import { Platform } from "react-native";
import React, { PureComponent } from "react";
import { compose } from "redux";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import FingerprintScanner from "react-native-fingerprint-scanner";

import { translate } from "react-i18next";
import type { T } from "../types/common";

import { privacySelector } from "../reducers/settings";
import type { Privacy } from "../reducers/settings";

import BiometricsIcon from "./BiometricsIcon";
import colors from "../colors";
import BottomModal from "./BottomModal";
import ModalBottomAction from "./ModalBottomAction";
import CancelButton from "./CancelButton";

type AuthProps = {
  onSuccess: () => void,
  onError: Error => void,
  t: T,
};

type ModalProps = {
  isVisible: boolean,
  onSuccess: () => void,
  onError: Error => void,
  onCancel: () => void,
  privacy: Privacy,
  t: T,
};

class Auth extends PureComponent<AuthProps> {
  componentDidMount() {
    this.auth();
  }

  pending = false;

  onSuccess = () => {
    const { onSuccess } = this.props;
    FingerprintScanner.release();
    this.pending = false;
    onSuccess();
  };

  onError = (error: Error) => {
    const { onError } = this.props;
    FingerprintScanner.release();
    this.pending = false;
    onError(error);
  };

  auth = async () => {
    if (this.pending) return;

    const { t } = this.props;

    this.pending = true;
    try {
      await FingerprintScanner.authenticate({
        description: t("auth.unlock.biometricsTitle"),
        onAttempt: this.onError,
      });
      this.onSuccess();
    } catch (error) {
      this.onError(error);
    }
  };

  render() {
    return null;
  }
}

export const RequestBiometricAuth = translate()(Auth);

const mapStateToProps = createStructuredSelector({
  privacy: privacySelector,
});

class RequestBiometricModal extends PureComponent<ModalProps> {
  cleanOnCancel = () => {
    const { onCancel } = this.props;

    FingerprintScanner.release();
    onCancel();
  };

  render() {
    const { isVisible, onSuccess, onError, privacy, t } = this.props;

    if (Platform.OS === "ios") {
      return isVisible ? (
        <RequestBiometricAuth onSuccess={onSuccess} onError={onError} />
      ) : null;
    }

    return (
      <BottomModal isOpened={isVisible}>
        <RequestBiometricAuth onSuccess={onSuccess} onError={onError} />
        <ModalBottomAction
          title={t("auth.unlock.biometricsTitle")}
          icon={
            <BiometricsIcon
              biometricsType={privacy.biometricsType}
              size={60}
              color={colors.live}
            />
          }
          footer={<CancelButton onPress={this.cleanOnCancel} />}
        />
      </BottomModal>
    );
  }
}

export default compose(
  connect(mapStateToProps),
  translate(),
)(RequestBiometricModal);

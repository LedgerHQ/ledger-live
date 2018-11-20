// @flow
import React, { PureComponent } from "react";
import { connect } from "react-redux";
import { translate } from "react-i18next";
import { createStructuredSelector } from "reselect";
import { privacySelector } from "../../reducers/settings";

import auth from "./auth";
import type { Privacy } from "../../reducers/settings";
import AuthScreen from "./AuthScreen";

const mapStateToProps = createStructuredSelector({
  privacy: privacySelector,
});

type State = {
  isLocked: boolean,
  biometricsError: ?Error,
};

type Props = {
  t: *,
  privacy: Privacy,
  children: *,
};

class AuthPass extends PureComponent<Props, State> {
  state = {
    isLocked: !!this.props.privacy,
    biometricsError: null,
  };

  componentDidMount() {
    this.auth();
  }

  unlock = () => {
    this.setState({
      isLocked: false,
      biometricsError: null,
    });
  };

  auth = () => {
    const { privacy, t } = this.props;
    const { isLocked } = this.state;
    if (isLocked && privacy.biometricsEnabled) {
      auth(t("auth.unlock.biometricsTitle"))
        .then(this.unlock)
        .catch(error => {
          this.setState({
            biometricsError: error,
          });
        });
    }
  };
  render() {
    const { children, privacy } = this.props;
    const { isLocked, biometricsError } = this.state;
    if (isLocked) {
      return (
        <AuthScreen
          biometricsError={biometricsError}
          privacy={privacy}
          unlock={this.unlock}
        />
      );
    }
    return children;
  }
}

export default translate()(connect(mapStateToProps)(AuthPass));

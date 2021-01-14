/* @flow */
import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import { compose } from "redux";
import { connect } from "react-redux";
import Switch from "../../../components/Switch";
import SettingsRow from "../../../components/SettingsRow";
import { setHideEmptyTokenAccounts } from "../../../actions/settings";
import withEnv from "../../../logic/withEnv";

type Props = {
  hideEmptyTokenAccountsEnabled: boolean,
  setHideEmptyTokenAccounts: boolean => void,
};

const mapDispatchToProps = {
  setHideEmptyTokenAccounts,
};

class HideEmptyTokenAccountsRow extends PureComponent<Props> {
  render() {
    const {
      hideEmptyTokenAccountsEnabled,
      setHideEmptyTokenAccounts,
      ...props
    } = this.props;
    return (
      <SettingsRow
        event="HideEmptyTokenAccountsRow"
        title={<Trans i18nKey="settings.display.hideEmptyTokenAccounts" />}
        desc={<Trans i18nKey="settings.display.hideEmptyTokenAccountsDesc" />}
        onPress={null}
        alignedTop
        {...props}
      >
        <Switch
          style={{ opacity: 0.99 }}
          value={hideEmptyTokenAccountsEnabled}
          onValueChange={setHideEmptyTokenAccounts}
        />
      </SettingsRow>
    );
  }
}

export default compose(
  withEnv("HIDE_EMPTY_TOKEN_ACCOUNTS", "hideEmptyTokenAccountsEnabled"),
  connect(null, mapDispatchToProps),
)(HideEmptyTokenAccountsRow);

import React from "react";
import { Trans } from "react-i18next";
import { compose } from "redux";
import { connect } from "react-redux";
import { Switch } from "@ledgerhq/native-ui";
import SettingsRow from "~/components/SettingsRow";
import { setHideEmptyTokenAccounts } from "~/actions/settings";
import withEnv from "~/logic/withEnv";

type Props = {
  hideEmptyTokenAccountsEnabled: boolean;
  setHideEmptyTokenAccounts: (_: boolean) => void;
};

const mapDispatchToProps = {
  setHideEmptyTokenAccounts,
};

function HideEmptyTokenAccountsRow({
  hideEmptyTokenAccountsEnabled,
  setHideEmptyTokenAccounts,
  ...props
}: Props) {
  return (
    <SettingsRow
      {...props}
      event="HideEmptyTokenAccountsRow"
      title={<Trans i18nKey="settings.display.hideEmptyTokenAccounts" />}
      desc={<Trans i18nKey="settings.display.hideEmptyTokenAccountsDesc" />}
    >
      <Switch checked={hideEmptyTokenAccountsEnabled} onChange={setHideEmptyTokenAccounts} />
    </SettingsRow>
  );
}

export default compose<React.ComponentType<Record<string, unknown>>>(
  withEnv("HIDE_EMPTY_TOKEN_ACCOUNTS", "hideEmptyTokenAccountsEnabled"),
  connect(null, mapDispatchToProps),
)(HideEmptyTokenAccountsRow);

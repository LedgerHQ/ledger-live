import React, { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Switch } from "@ledgerhq/native-ui";
import SettingsRow from "~/components/SettingsRow";
import { setHideEmptyTokenAccounts } from "~/actions/settings";
import { hideEmptyTokenAccountsEnabledSelector } from "~/reducers/settings";

function HideEmptyTokenAccountsRow() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const hideEmptyTokenAccountsEnabled = useSelector(hideEmptyTokenAccountsEnabledSelector);

  const onChange = useCallback(
    (enabled: boolean) => {
      dispatch(setHideEmptyTokenAccounts(enabled));
    },
    [dispatch],
  );

  return (
    <SettingsRow
      event="HideEmptyTokenAccountsRow"
      title={t("settings.display.hideEmptyTokenAccounts")}
      desc={t("settings.display.hideEmptyTokenAccountsDesc")}
    >
      <Switch checked={hideEmptyTokenAccountsEnabled} onChange={onChange} />
    </SettingsRow>
  );
}

export default memo(HideEmptyTokenAccountsRow);

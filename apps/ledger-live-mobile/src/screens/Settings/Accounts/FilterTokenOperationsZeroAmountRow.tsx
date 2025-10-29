import React, { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { Switch } from "@ledgerhq/native-ui";
import { setFilterTokenOperationsZeroAmount } from "~/actions/settings";
import SettingsRow from "~/components/SettingsRow";
import { filterTokenOperationsZeroAmountEnabledSelector } from "~/reducers/settings";

function FilterTokenOperationsZeroAmountRow() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const filterTokenOperationsZeroAmountEnabled = useSelector(
    filterTokenOperationsZeroAmountEnabledSelector,
  );

  const onChange = useCallback(
    (enabled: boolean) => {
      dispatch(setFilterTokenOperationsZeroAmount(enabled));
    },
    [dispatch],
  );

  return (
    <SettingsRow
      event="FilterTokenOperationsZeroAmountRow"
      title={t("settings.display.filterTokenOperationsZeroAmount")}
      desc={t("settings.display.filterTokenOperationsZeroAmountDesc")}
    >
      <Switch checked={filterTokenOperationsZeroAmountEnabled} onChange={onChange} />
    </SettingsRow>
  );
}

export default memo(FilterTokenOperationsZeroAmountRow);

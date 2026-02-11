import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import { allowDebugReactQuerySelector } from "~/renderer/reducers/settings";
import { setAllowDebugReactQuery } from "~/renderer/actions/settings";
import Track from "~/renderer/analytics/Track";
import { Switch } from "@ledgerhq/lumen-ui-react";
import DeveloperClassicRow from "../components/DeveloperClassicRow";

const AllowDebugReactQueryToggle = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const allowDebug = useSelector(allowDebugReactQuerySelector);
  const onSetAllowDebug = useCallback(
    (checked: boolean) => dispatch(setAllowDebugReactQuery(checked)),
    [dispatch],
  );
  return (
    <DeveloperClassicRow
      title={t("settings.developer.debugReactQuery")}
      desc={t("settings.developer.debugReactQueryDesc")}
    >
      <Track onUpdate event="AllowDebugReactQuery" />
      <Switch
        selected={allowDebug}
        onChange={onSetAllowDebug}
        data-testid="settings-allow-debug-react-query"
      />
    </DeveloperClassicRow>
  );
};
export default AllowDebugReactQueryToggle;

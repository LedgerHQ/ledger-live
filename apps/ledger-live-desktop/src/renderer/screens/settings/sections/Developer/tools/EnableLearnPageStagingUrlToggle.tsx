import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import { enableLearnPageStagingUrlSelector } from "~/renderer/reducers/settings";
import { setEnableLearnPageStagingUrl } from "~/renderer/actions/settings";
import { Switch } from "@ledgerhq/lumen-ui-react";
import DeveloperClassicRow from "../components/DeveloperClassicRow";

const EnableLearnPageStagingUrl = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const enableLearnPageStagingUrl = useSelector(enableLearnPageStagingUrlSelector);
  const onSetEnablePlatformDevTools = useCallback(
    (checked: boolean) => dispatch(setEnableLearnPageStagingUrl(checked)),
    [dispatch],
  );
  return (
    <DeveloperClassicRow
      title={t("settings.developer.enableLearnStagingUrl")}
      desc={t("settings.developer.enableLearnStagingUrlDesc")}
    >
      <Switch
        selected={!!enableLearnPageStagingUrl}
        onChange={onSetEnablePlatformDevTools}
        data-testid="settings-enable-earn-page-staging-url"
      />
    </DeveloperClassicRow>
  );
};
export default EnableLearnPageStagingUrl;

import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { setEnv } from "@ledgerhq/live-env";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";

import Track from "~/renderer/analytics/Track";
import { Switch } from "@ledgerhq/lumen-ui-react";
import DeveloperClassicRow from "../components/DeveloperClassicRow";

const MockAppUpdate = () => {
  const { t } = useTranslation();
  const env = useEnv("MOCK_APP_UPDATE");

  const onSetMockAppUpdate = useCallback((checked: boolean) => {
    setEnv("MOCK_APP_UPDATE", checked);
  }, []);

  return (
    <DeveloperClassicRow
      title={t("settings.developer.mockAppUpdate")}
      desc={t("settings.developer.mockAppUpdateDesc")}
    >
      <Track onUpdate event="MockAppUpdate" />
      <Switch
        selected={env}
        onChange={onSetMockAppUpdate}
        data-testid="settings-allow-debug-apps"
      />
    </DeveloperClassicRow>
  );
};
export default MockAppUpdate;

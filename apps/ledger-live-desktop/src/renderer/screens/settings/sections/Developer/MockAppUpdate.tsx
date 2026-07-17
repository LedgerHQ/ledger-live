import useEnv from "@shared/live-env/hooks";
import { setEnv } from "@shared/live-env";
import React, { useCallback } from "react";

import Track from "~/renderer/analytics/Track";
import { Switch } from "@ledgerhq/lumen-ui-react";

const MockAppUpdate = () => {
  const env = useEnv("MOCK_APP_UPDATE");

  const onSetMockAppUpdate = useCallback((checked: boolean) => {
    setEnv("MOCK_APP_UPDATE", checked);
  }, []);

  return (
    <>
      <Track onUpdate event="MockAppUpdate" />
      <Switch
        selected={env}
        onChange={onSetMockAppUpdate}
        data-testid="settings-allow-debug-apps"
      />
    </>
  );
};
export default MockAppUpdate;

import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { setEnv } from "@ledgerhq/live-env";
import React, { useCallback } from "react";

import Track from "~/renderer/analytics/Track";
import Switch from "~/renderer/components/Switch";

const MockAppUpdate = () => {
  const env = useEnv("MOCK_APP_UPDATE");

  const onSetMockAppUpdate = useCallback((checked: boolean) => {
    setEnv("MOCK_APP_UPDATE", checked);
  }, []);

  return (
    <>
      <Track onUpdate event="MockAppUpdate" />
      <Switch
        isChecked={env}
        onChange={onSetMockAppUpdate}
        data-testid="settings-allow-debug-apps"
      />
    </>
  );
};
export default MockAppUpdate;

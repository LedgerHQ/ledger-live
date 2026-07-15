import React, { useState } from "react";
import { getEnv } from "@shared/env";
import { Switch } from "@ledgerhq/lumen-ui-react";
import Track from "~/renderer/analytics/Track";
import { setEnvOnAllThreads } from "~/helpers/env";
import { MOCK_SERVER_TRANSPORT_STORAGE_KEY } from "~/renderer/mockServerTransport";

const EnableMockServerTransportToggle = () => {
  const [enabled, setEnabled] = useState<boolean>(() => getEnv("MOCK_SERVER_TRANSPORT"));

  const handleChangeSwitch = (checked: boolean) => {
    setEnvOnAllThreads("MOCK_SERVER_TRANSPORT", checked);
    window.localStorage.setItem(MOCK_SERVER_TRANSPORT_STORAGE_KEY, checked ? "1" : "0");
    setEnabled(checked);
    // Reload the renderer so bootstrapMockServerTransport() and the DMK build
    // re-run with the new value (both read the flag once, at boot).
    window.api?.reloadRenderer();
  };

  return (
    <>
      <Track onUpdate event="EnableMockServerTransport" />
      <Switch
        selected={enabled}
        onChange={handleChangeSwitch}
        data-testid="settings-enable-mock-server-transport"
      />
    </>
  );
};

export default EnableMockServerTransportToggle;

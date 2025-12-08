import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { enablePlatformDevToolsSelector } from "~/renderer/reducers/settings";
import { setEnablePlatformDevTools } from "~/renderer/actions/settings";
import Track from "~/renderer/analytics/Track";
import { Switch } from "@ledgerhq/ldls-ui-react";
const EnablePlatformDevToolsToggle = () => {
  const dispatch = useDispatch();
  const enablePlatformDevTools = useSelector(enablePlatformDevToolsSelector);
  const onSetEnablePlatformDevTools = useCallback(
    (checked: boolean) => dispatch(setEnablePlatformDevTools(checked)),
    [dispatch],
  );
  return (
    <>
      <Track onUpdate event="AllowExperimentalApps" />
      <Switch
        selected={enablePlatformDevTools}
        onChange={onSetEnablePlatformDevTools}
        data-testid="settings-enable-platform-dev-tools-apps"
      />
    </>
  );
};
export default EnablePlatformDevToolsToggle;

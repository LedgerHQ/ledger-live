import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { allowDebugAppsSelector } from "~/renderer/reducers/settings";
import { setAllowDebugApps } from "~/renderer/actions/settings";
import Track from "~/renderer/analytics/Track";
import Switch from "~/renderer/components/Switch";

const AllowDebugAppsToggle = () => {
  const dispatch = useDispatch();
  const allowDebugApps = useSelector(allowDebugAppsSelector);
  const onSetAllowDebugApps = useCallback(
    (checked: boolean) => dispatch(setAllowDebugApps(checked)),
    [dispatch],
  );
  return (
    <>
      <Track onUpdate event="AllowDebugApps" />
      <Switch
        isChecked={allowDebugApps}
        onChange={onSetAllowDebugApps}
        data-testid="settings-allow-debug-apps"
      />
    </>
  );
};
export default AllowDebugAppsToggle;

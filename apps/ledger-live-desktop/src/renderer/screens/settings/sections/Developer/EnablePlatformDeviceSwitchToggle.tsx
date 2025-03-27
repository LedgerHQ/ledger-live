import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { enablePlatformDeviceSwitchSelector } from "~/renderer/reducers/settings";
import { setEnablePlatformDeviceSwitch } from "~/renderer/actions/settings";
import Track from "~/renderer/analytics/Track";
import Switch from "~/renderer/components/Switch";
const EnablePlatformDeviceSwitchToggle = () => {
  const dispatch = useDispatch();
  const EnablePlatformDeviceSwitchToggle = useSelector(enablePlatformDeviceSwitchSelector);
  const onSetEnablePlatformDeviceSwitch = useCallback(
    (checked: boolean) => dispatch(setEnablePlatformDeviceSwitch(checked)),
    [dispatch],
  );
  return (
    <>
      <Track onUpdate event="AllowExperimentalApps" />
      <Switch
        isChecked={EnablePlatformDeviceSwitchToggle}
        onChange={onSetEnablePlatformDeviceSwitch}
        data-testid="settings-enable-platform-dev-tools-apps"
      />
    </>
  );
};
export default EnablePlatformDeviceSwitchToggle;

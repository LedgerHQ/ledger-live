import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { allowDebugReactQuerySelector } from "~/renderer/reducers/settings";
import { setAllowDebugReactQuery } from "~/renderer/actions/settings";
import Track from "~/renderer/analytics/Track";
import Switch from "~/renderer/components/Switch";
const AllowDebugReactQueryToggle = () => {
  const dispatch = useDispatch();
  const allowDebug = useSelector(allowDebugReactQuerySelector);
  const onSetAllowDebug = useCallback(
    (checked: boolean) => dispatch(setAllowDebugReactQuery(checked)),
    [dispatch],
  );
  return (
    <>
      <Track onUpdate event="AllowDebugReactQuery" />
      <Switch
        isChecked={allowDebug}
        onChange={onSetAllowDebug}
        data-test-id="settings-allow-debug-react-query"
      />
    </>
  );
};
export default AllowDebugReactQueryToggle;

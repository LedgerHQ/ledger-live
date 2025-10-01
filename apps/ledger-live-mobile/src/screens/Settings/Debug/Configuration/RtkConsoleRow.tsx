import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import SettingsRow from "~/components/SettingsRow";
import Switch from "~/components/Switch";

import { rtkDevPanelSelector, setRtkDevPanel } from "~/reducers/tools";

const RtkConsoleRow = () => {
  const dispatch = useDispatch();
  const enabled = useSelector(rtkDevPanelSelector);
  const onToggle = useCallback(() => {
    dispatch(setRtkDevPanel(!enabled));
  }, [dispatch, enabled]);

  return (
    <SettingsRow
      event="RtkConsoleRow"
      title="RTK overlay"
      desc="Toggle RTK Query console, showing requests overlay"
    >
      <Switch value={enabled} onValueChange={onToggle} />
    </SettingsRow>
  );
};

export default RtkConsoleRow;

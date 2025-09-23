import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import SettingsRow from "~/components/SettingsRow";
import Switch from "~/components/Switch";
import { setRtkConsoleEnabled } from "~/actions/settings";
import { State } from "~/reducers/types";

const RtkConsoleRow = () => {
  const dispatch = useDispatch();
  const enabled = useSelector((s: State) => s.settings.rtkConsoleEnabled ?? false);
  const onToggle = useCallback(() => {
    dispatch(setRtkConsoleEnabled(!enabled));
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

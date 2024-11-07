import React, { useCallback } from "react";
import Switch from "~/renderer/components/Switch";
import Track from "~/renderer/analytics/Track";
import { track } from "~/renderer/analytics/segment";
import { useDispatch, useSelector } from "react-redux";
import { setMevProtection } from "~/renderer/actions/settings";
import { mevProtectionSelector } from "~/renderer/reducers/settings";

const MevProtectionRow = () => {
  const mevProctection = useSelector(mevProtectionSelector);

  const dispatch = useDispatch();

  const toggleMevProtection = useCallback(
    (value: boolean) => {
      dispatch(setMevProtection(value));

      track(
        "toggle_clicked",
        {
          toggleAction: value ? "ON" : "OFF",
          toggle: "MEV",
          page: "Page Settings General",
        },
        true,
      );
    },
    [dispatch],
  );

  return (
    <>
      <Track onUpdate event={mevProctection ? "mev_activated" : "mev_disactivated"} />
      <Switch isChecked={mevProctection} onChange={() => toggleMevProtection(!mevProctection)} />
    </>
  );
};
export default MevProtectionRow;

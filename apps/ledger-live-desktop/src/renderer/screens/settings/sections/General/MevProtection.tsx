import React from "react";
import Switch from "~/renderer/components/Switch";
import { track } from "~/renderer/analytics/segment";
import { useDispatch, useSelector } from "react-redux";
import { setMevProtection } from "~/renderer/actions/settings";
import { mevProtectionSelector } from "~/renderer/reducers/settings";

const MevProtectionRow = () => {
  const mevProtection = useSelector(mevProtectionSelector);

  const dispatch = useDispatch();

  const toggleMevProtection = (value: boolean) => {
    dispatch(setMevProtection(value));

    track("toggle_clicked", {
      toggleAction: value ? "ON" : "OFF",
      toggle: "MEV",
      page: "Page Settings General",
    });
  };

  return <Switch isChecked={mevProtection} onChange={toggleMevProtection} />;
};
export default MevProtectionRow;

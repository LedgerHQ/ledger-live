import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { shareAnalyticsSelector } from "~/renderer/reducers/settings";
import { setShareAnalytics } from "~/renderer/actions/settings";
import { track } from "~/renderer/analytics/segment";
import Switch from "~/renderer/components/Switch";

const ShareAnalyticsButtonFF = () => {
  const shareAnalytics = useSelector(shareAnalyticsSelector);
  const dispatch = useDispatch();
  const toggleShareAnalytics = (value: boolean) => {
    dispatch(setShareAnalytics(value));
    // TODO: check if event is not fired when we opt out
    track("toggle_clicked", {
      toggle: "Analytics",
      enabled: value,
      page: "settings general",
    });
  };
  return (
    <Switch
      isChecked={shareAnalytics}
      onChange={toggleShareAnalytics}
      data-e2e="shareAnalytics_button"
    />
  );
};
export default ShareAnalyticsButtonFF;

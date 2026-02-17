import React from "react";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import { shareAnalyticsSelector } from "~/renderer/reducers/settings";
import { setShareAnalytics } from "~/renderer/actions/settings";
import { track, updateIdentify } from "~/renderer/analytics/segment";
import Switch from "~/renderer/components/Switch";

const ShareAnalyticsButtonFF = () => {
  const shareAnalytics = useSelector(shareAnalyticsSelector);
  const dispatch = useDispatch();

  const toggleShareAnalytics = async (value: boolean) => {
    dispatch(setShareAnalytics(value));
    await updateIdentify({ force: true });
    track(
      "toggle_clicked",
      {
        toggle: "Analytics",
        enabled: value,
        page: "settings general",
      },
      true,
    );
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

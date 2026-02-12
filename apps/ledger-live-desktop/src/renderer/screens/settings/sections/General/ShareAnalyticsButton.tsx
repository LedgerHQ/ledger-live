import React from "react";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import { trackingEnabledSelector } from "~/renderer/reducers/settings";
import {
  setShareAnalytics,
  setSharePersonalizedRecommendations,
} from "~/renderer/actions/settings";
import { updateIdentify } from "~/renderer/analytics/segment";
import Track from "~/renderer/analytics/Track";
import Switch from "~/renderer/components/Switch";

const ShareAnalyticsButton = () => {
  const shareAnalytics = useSelector(trackingEnabledSelector);
  const dispatch = useDispatch();

  const toggleShareAnalytics = async (value: boolean) => {
    dispatch(setShareAnalytics(value));
    dispatch(setSharePersonalizedRecommendations(value));
    await updateIdentify({ force: true });
  };

  return (
    <>
      <Track mandatory onUpdate event={shareAnalytics ? "AnalyticsEnabled" : "AnalyticsDisabled"} />
      <Switch
        isChecked={shareAnalytics}
        onChange={toggleShareAnalytics}
        data-e2e="shareAnalytics_button"
      />
    </>
  );
};
export default ShareAnalyticsButton;

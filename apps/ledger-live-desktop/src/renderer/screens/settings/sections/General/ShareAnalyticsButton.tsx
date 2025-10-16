import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { trackingEnabledSelector } from "~/renderer/reducers/settings";
import {
  setShareAnalytics,
  setSharePersonalizedRecommendations,
} from "~/renderer/actions/settings";
import Track from "~/renderer/analytics/Track";
import Switch from "~/renderer/components/Switch";
const ShareAnalyticsButton = () => {
  const shareAnalytics = useSelector(trackingEnabledSelector);
  const dispatch = useDispatch();
  const onChangeShareAnalytics = useCallback(
    (value: boolean) => {
      dispatch(setShareAnalytics(value));
      dispatch(setSharePersonalizedRecommendations(value));
    },
    [dispatch],
  );
  return (
    <>
      <Track mandatory onUpdate event={shareAnalytics ? "AnalyticsEnabled" : "AnalyticsDisabled"} />
      <Switch
        isChecked={shareAnalytics}
        onChange={onChangeShareAnalytics}
        data-e2e="shareAnalytics_button"
      />
    </>
  );
};
export default ShareAnalyticsButton;

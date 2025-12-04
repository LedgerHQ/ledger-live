import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { sharePersonalizedRecommendationsSelector } from "~/renderer/reducers/settings";
import { setSharePersonalizedRecommendations } from "~/renderer/actions/settings";
import { track } from "~/renderer/analytics/segment";
import Switch from "~/renderer/components/Switch";

const SharePersonnalRecoButtonFF = () => {
  const sharePersonalRecommendations = useSelector(sharePersonalizedRecommendationsSelector);
  const dispatch = useDispatch();

  const toggleSharePersonalizedRecommendations = (value: boolean) => {
    dispatch(setSharePersonalizedRecommendations(value));
    // TODO: check if it is not called when analytics is opt out
    track("toggle_clicked", {
      toggle: "personalised recommendations",
      enabled: value,
      page: "settings general",
    });
  };
  return (
    <Switch
      isChecked={sharePersonalRecommendations}
      onChange={toggleSharePersonalizedRecommendations}
      data-e2e="sharePersonalizedRecommendations_button"
    />
  );
};
export default SharePersonnalRecoButtonFF;

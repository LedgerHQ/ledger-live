import React from "react";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import { sharePersonalizedRecommendationsSelector } from "~/renderer/reducers/settings";
import { setSharePersonalizedRecommendations } from "~/renderer/actions/settings";
import { track, updateIdentify } from "~/renderer/analytics/segment";
import Switch from "~/renderer/components/Switch";

const SharePersonnalRecoButtonFF = () => {
  const sharePersonalRecommendations = useSelector(sharePersonalizedRecommendationsSelector);
  const dispatch = useDispatch();

  const toggleSharePersonalizedRecommendations = async (value: boolean) => {
    dispatch(setSharePersonalizedRecommendations(value));
    await updateIdentify({ force: true });
    track(
      "toggle_clicked",
      {
        toggle: "personalised recommendations",
        enabled: value,
        page: "settings general",
      },
      true,
    );
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

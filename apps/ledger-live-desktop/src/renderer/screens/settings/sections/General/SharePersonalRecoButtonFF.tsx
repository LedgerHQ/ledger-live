import React, { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { sharePersonalizedRecommendationsSelector } from "~/renderer/reducers/settings";
import { setSharePersonalizedRecommendations } from "~/renderer/actions/settings";
import { track } from "~/renderer/analytics/segment";
import Switch from "~/renderer/components/Switch";

const SharePersonnalRecoButtonFF = () => {
  const sharePersonalRecommendations = useSelector(sharePersonalizedRecommendationsSelector);
  const dispatch = useDispatch();
  const onChangeSharePersonalizedRecommendations = useCallback(
    (value: boolean) => {
      dispatch(setSharePersonalizedRecommendations(value));
      track(
        "toggle_clicked",
        {
          toggle: "personalised recommendations",
          enabled: value,
          page: "settings general",
        },
        true,
      );
    },
    [dispatch],
  );
  return (
    <Switch
      isChecked={sharePersonalRecommendations}
      onChange={onChangeSharePersonalizedRecommendations}
      data-e2e="sharePersonalizedRecommendations_button"
    />
  );
};
export default SharePersonnalRecoButtonFF;

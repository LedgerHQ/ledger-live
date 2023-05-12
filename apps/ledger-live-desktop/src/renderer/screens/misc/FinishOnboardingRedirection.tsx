import React, { useEffect } from "react";
import { useHistory } from "react-router-dom";
import { saveSettings } from "~/renderer/actions/settings";
import { useDispatch } from "react-redux";

export default function FinishOnboardingRedirection() {
  const history = useHistory();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(saveSettings({ hasCompletedOnboarding: true }));
    history.push({
      pathname: `/`,
    });
  }, [dispatch, history]);

  return <></>;
}

import React, { useCallback } from "react";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import { hasCompletedOnboardingSelector } from "~/renderer/reducers/settings";
import { saveSettings } from "~/renderer/actions/settings";
import { Switch } from "@ledgerhq/lumen-ui-react";

const RebornModeToggle = () => {
  const dispatch = useDispatch();
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);

  const handleChange = useCallback(
    (checked: boolean) => {
      dispatch(saveSettings({ hasCompletedOnboarding: checked }));
    },
    [dispatch],
  );

  return (
    <Switch
      selected={hasCompletedOnboarding}
      onChange={handleChange}
      data-testid="settings-has-completed-onboarding"
    />
  );
};

export default RebornModeToggle;

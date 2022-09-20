import React, { useEffect, useCallback } from "react";
import { Flex, Text } from "@ledgerhq/react-ui";
import { useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import {
  useAllPostOnboardingActionsCompleted,
  usePostOnboardingHubState,
} from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { clearPostOnboardingLastActionCompleted } from "@ledgerhq/live-common/postOnboarding/actions";

const PostOnboardingHub = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { lastActionCompleted, actionsState } = usePostOnboardingHubState();
  const { actionCompletedHubTitle, actionCompletedPopupLabel } = lastActionCompleted ?? {};

  const clearLastActionCompleted = useCallback(() => {
    dispatch(clearPostOnboardingLastActionCompleted());
  }, [dispatch]);
  console.log("here", actionsState);
  return (
    <Flex alignItems="center" width="100%" justifyContent="center">
      <Text variant="h1">{"hello"}</Text>
    </Flex>
  );
};

export default PostOnboardingHub;

import React, { useCallback } from "react";
import { useDispatch } from "react-redux";
import { Flex, Link, Text } from "@ledgerhq/react-ui";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { clearPostOnboardingLastActionCompleted } from "@ledgerhq/live-common/postOnboarding/actions";

import PostOnboardingHub from ".";
import { setDrawer } from "~/renderer/drawers/Provider";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";

const PostOnboardingHubContent = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const dispatch = useDispatch();

  const clearLastActionCompleted = useCallback(() => {
    dispatch(clearPostOnboardingLastActionCompleted());
    setDrawer();
  }, [dispatch]);

  const handleSkipButton = useCallback(() => {
    history.push("/");
  }, [history]);

  return (
    <Flex
      px={3}
      ml={4}
      flexDirection="column"
      justifyContent="center"
      height="100%"
      width="100%"
      maxWidth={450}
    >
      <PostOnboardingHub />
      <Link onClick={handleSkipButton} data-test-id={"postonboarding-hub-skip-button"} mt={5}>
        {t("postOnboarding.postOnboardingContent.skipLink")}
      </Link>
    </Flex>
  );
};

export default withV3StyleProvider(PostOnboardingHubContent);

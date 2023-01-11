import React, { useCallback, useEffect } from "react";
import { Flex, Link } from "@ledgerhq/react-ui";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAllPostOnboardingActionsCompleted } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import PostOnboardingHub from ".";
import { withV3StyleProvider } from "~/renderer/styles/StyleProviderV3";

const PostOnboardingHubContent = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const allDone = useAllPostOnboardingActionsCompleted();

  const handleSkipButton = useCallback(() => {
    history.push("/");
  }, [history]);

  useEffect(() => {
    if (allDone) {
      const timeout = setTimeout(() => history.push("/"), 4000);
      return () => clearTimeout(timeout);
    }
  }, [allDone, history]);

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
      {!allDone ? (
        <Link onClick={handleSkipButton} data-test-id={"postonboarding-hub-skip-button"} mt={5}>
          {t("postOnboarding.postOnboardingContent.skipLink")}
        </Link>
      ) : null}
    </Flex>
  );
};

export default withV3StyleProvider(PostOnboardingHubContent);

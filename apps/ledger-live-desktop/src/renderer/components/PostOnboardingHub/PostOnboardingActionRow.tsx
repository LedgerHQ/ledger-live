import React, { useCallback } from "react";
import { Flex, Icons, Tag, Text } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
// import { useHistory } from "react-router-dom";
import { PostOnboardingActionState, PostOnboardingAction } from "@ledgerhq/types-live";
import { track } from "~/renderer/analytics/segment";
import styled from "styled-components";

export type Props = PostOnboardingAction & PostOnboardingActionState;

const ActionRowWrapper = styled(Flex)<{ completed: boolean }>`
  cursor: ${p => (p.completed ? "auto" : "pointer")};
`;

const PostOnboardingActionRow: React.FC<Props> = props => {
  const { id, Icon, title, description, tagLabel, buttonLabelForAnalyticsEvent, completed } = props;
  const { t } = useTranslation();
  // const history = useHistory();

  const handleStartAction = useCallback(() => {
    /**
     * WARNING:
     * I have followed the PostOnboarding hell all the way up the the PostOnbardingProvider
     * Here the props are a PostOnboardingAction + PostOnboardingState (which does not interest us)
     * PostOnbardingAction extends a WithNavigationParams { navigationParams?: any[] } _please help me_
     * Now, when you look at all the supposedly available PostOnboardingAction coming from the provider
     * we get to ./apps/ledger-live-desktop/src/renderer/components/PostOnboardingHub/logic/PostOnboardingProviderWrapped.tsx
     * which provides the getPostOnboardingAction which can return any of these action
     * ```
     * - claimMock
     * - migrateAssetsMock
     * - personalizeMock
     * - customImage
     * ```
     * which of those, none of them actually include a `navigationParams`
     * cf: ./apps/ledger-live-desktop/src/renderer/components/PostOnboardingHub/logic/index.tsx
     *
     * Conclusion: since our typings are bad (navigationParams?: any[] oskour) and since history.push
     * is a being a pain, I will comment it out for now as I'm pretty sure it will not break anything
     * as it's the only way I have of fixing this for now.
     */

    // if ("navigationParams" in props && props.navigationParams) history.push(props.navigationParams);
    // else
    if ("startAction" in props) {
      props.startAction();
      buttonLabelForAnalyticsEvent &&
        track("button_clicked", { button: buttonLabelForAnalyticsEvent });
    }
  }, [props, buttonLabelForAnalyticsEvent]);
  // }, [props, history, buttonLabelForAnalyticsEvent]);

  return (
    <ActionRowWrapper
      data-test-id={`postonboarding-action-row-${id}`}
      flexDirection="row"
      alignItems="center"
      backgroundColor="neutral.c30"
      borderRadius={3}
      marginBottom={4}
      completed={completed}
      padding="32px 24px 32px 24px"
      {...(completed
        ? undefined
        : {
            onClick: () => {
              handleStartAction();
            },
          })}
    >
      <Flex flexDirection="row" alignItems="center" flexShrink={1}>
        <Icon size={24} color={completed ? "neutral.c70" : "primary.c80"} />
        <Flex ml={6} flexDirection="column" justifyContent="center" flex={1}>
          <Text
            variant="largeLineHeight"
            fontWeight="medium"
            color={completed ? "neutral.c70" : "neutral.c100"}
          >
            {t(title)}
          </Text>
          {!completed ? (
            <Text variant="body" fontWeight="medium" color="neutral.c70">
              {t(description)}
            </Text>
          ) : null}
        </Flex>
      </Flex>
      <Flex
        flexDirection="row"
        alignItems="center"
        justifyContent="flex-end"
        flexShrink={0}
        flexGrow={1}
        pl={6}
      >
        {tagLabel ? (
          <Tag mr={6} size="medium" backgroundColor="primary.c20">
            {tagLabel}
          </Tag>
        ) : null}
        {completed ? (
          <Icons.CheckAloneMedium color="success.c50" size={16} />
        ) : (
          <Icons.ChevronRightMedium color="neutral.c100" size={16} />
        )}
      </Flex>
    </ActionRowWrapper>
  );
};

export default PostOnboardingActionRow;

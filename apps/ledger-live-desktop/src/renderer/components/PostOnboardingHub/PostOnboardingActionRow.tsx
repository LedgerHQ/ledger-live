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

  const handleStartAction = useCallback(() => {
    if ("startAction" in props) {
      props.startAction();
      buttonLabelForAnalyticsEvent &&
        track("button_clicked", { button: buttonLabelForAnalyticsEvent, flow: "post-onboarding" });
    }
  }, [props, buttonLabelForAnalyticsEvent]);

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
      <Flex flexDirection="row" alignItems="flex-start" flexShrink={1}>
        <Icon size="M" color={completed ? "neutral.c60" : "primary.c80"} />
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
          <Icons.Check color="success.c70" size={"M"} />
        ) : (
          <Icons.ChevronRight color="neutral.c100" size={"M"} />
        )}
      </Flex>
    </ActionRowWrapper>
  );
};

export default PostOnboardingActionRow;

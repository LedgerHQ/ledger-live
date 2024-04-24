import React, { useCallback, useEffect, useState } from "react";
import { Flex, Icons, Tag, Text } from "@ledgerhq/react-ui";
import { useTranslation } from "react-i18next";
import { PostOnboardingActionState, PostOnboardingAction } from "@ledgerhq/types-live";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { getDeviceModel } from "@ledgerhq/devices";
import { track } from "~/renderer/analytics/segment";
import styled from "styled-components";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import { AllModalNames } from "~/renderer/modals/types";
import { useHistory } from "react-router";
import { useCompleteActionCallback } from "./logic/useCompleteAction";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

export type Props = PostOnboardingAction &
  PostOnboardingActionState & {
    deviceModelId: DeviceModelId | null;
  };

const ActionRowWrapper = styled(Flex)<{ completed: boolean }>`
  cursor: ${p => (p.completed ? "auto" : "pointer")};
`;

const PostOnboardingActionRow: React.FC<Props> = props => {
  const {
    id,
    Icon,
    title,
    description,
    tagLabel,
    buttonLabelForAnalyticsEvent,
    completed,
    getIsAlreadyCompleted,
    deviceModelId,
    shouldCompleteOnStart,
  } = props;
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const history = useHistory();
  const recoverServices = useFeature("protectServicesDesktop");
  const protectId = recoverServices?.params?.protectId ?? "protect-prod";

  const completeAction = useCompleteActionCallback();
  const [isActionCompleted, setIsActionCompleted] = useState(false);

  const initIsActionCompleted = useCallback(async () => {
    setIsActionCompleted(completed || !!(await getIsAlreadyCompleted?.({ protectId })));
  }, [setIsActionCompleted, completed, getIsAlreadyCompleted, protectId]);

  useEffect(() => {
    initIsActionCompleted();
  }, [initIsActionCompleted]);

  const handleStartAction = useCallback(() => {
    const openModalCallback = (modalName: AllModalNames) => {
      // isFromPostOnboardingEntryPoint param can be used to e.g. hide staking step in the receive ETH flow modals.
      dispatch(openModal(modalName, { isFromPostOnboardingEntryPoint: true }));
    };
    const navigationCallback = (location: Record<string, unknown> | string) => {
      history.push(location);
    };

    if ("startAction" in props && deviceModelId !== null) {
      props.startAction({ openModalCallback, navigationCallback, deviceModelId, protectId });
      buttonLabelForAnalyticsEvent &&
        track("button_clicked2", {
          button: buttonLabelForAnalyticsEvent,
          deviceModelId,
          flow: "post-onboarding",
        });
    }
    shouldCompleteOnStart && completeAction(id);
  }, [
    props,
    dispatch,
    history,
    buttonLabelForAnalyticsEvent,
    deviceModelId,
    completeAction,
    id,
    shouldCompleteOnStart,
    protectId,
  ]);

  return (
    <ActionRowWrapper
      data-test-id={`postonboarding-action-row-${id}`}
      flexDirection="row"
      alignItems="center"
      backgroundColor="neutral.c30"
      borderRadius={3}
      marginBottom={4}
      completed={isActionCompleted}
      padding="32px 24px 32px 24px"
      {...(isActionCompleted
        ? undefined
        : {
            onClick: () => {
              handleStartAction();
            },
          })}
    >
      <Flex flexDirection="row" alignItems="flex-start" flexShrink={1}>
        <Icon size="M" color={"primary.c80"} />
        <Flex ml={6} flexDirection="column" justifyContent="center" flex={1}>
          <Text
            variant="largeLineHeight"
            fontWeight="medium"
            color={isActionCompleted ? "neutral.c70" : "neutral.c100"}
          >
            {t(title)}
          </Text>
          {!isActionCompleted ? (
            <Text variant="body" fontWeight="medium" color="neutral.c70">
              {t(description, {
                productName: getDeviceModel(deviceModelId ?? DeviceModelId.stax).productName,
              })}
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
        {isActionCompleted ? (
          <Icons.Check color="success.c70" size={"M"} />
        ) : (
          <Icons.ChevronRight color="neutral.c100" size={"M"} />
        )}
      </Flex>
    </ActionRowWrapper>
  );
};

export default PostOnboardingActionRow;

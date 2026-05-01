import React from "react";
import { Flex, IconsLegacy, Tag, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "~/context/Locale";
import Touchable from "../Touchable";
import { usePostOnboardingActionPress } from "~/logic/postOnboarding/usePostOnboardingActionPress";
import type { PostOnboardingActionRowProps } from "./PostOnboardingActionRow.types";

export type { PostOnboardingActionRowProps } from "./PostOnboardingActionRow.types";

const PostOnboardingActionRow: React.FC<PostOnboardingActionRowProps> = props => {
  const { Icon, title, titleCompleted, description, tagLabel, disabled, productName } = props;
  const { t } = useTranslation();
  const { isActionCompleted, handlePress, isPressDisabled } = usePostOnboardingActionPress(props);

  return (
    <Touchable disabled={isPressDisabled} onPress={isPressDisabled ? undefined : handlePress}>
      <Flex
        flexDirection="row"
        alignItems="center"
        py={1}
        justifyContent="space-between"
        opacity={disabled ? 0.5 : 1}
      >
        <Flex flexDirection="row" alignItems="flex-start" flexShrink={1}>
          <Icon size={"M"} color={"primary.c80"} />
          <Flex ml={6} flexDirection="column" justifyContent="center" flex={1}>
            <Flex flexDirection="row" alignItems="center">
              <Text
                variant="largeLineHeight"
                fontWeight="medium"
                color={isActionCompleted ? "neutral.c70" : "neutral.c100"}
              >
                {t(isActionCompleted ? titleCompleted : title)}
              </Text>
              {tagLabel ? (
                <Tag size="small" ml={3} type="color" uppercase={false}>
                  {t(tagLabel)}
                </Tag>
              ) : null}
            </Flex>
            {isActionCompleted || description === undefined ? null : (
              <Text variant="body" fontWeight="medium" color="neutral.c70">
                {t(description, { productName })}
              </Text>
            )}
          </Flex>
        </Flex>
        <Flex flexDirection="row" alignItems="center" flexShrink={0} flexGrow={1} pl={6}>
          {disabled ? null : isActionCompleted ? (
            <IconsLegacy.CheckAloneMedium color="success.c50" size={20} />
          ) : (
            <IconsLegacy.ChevronRightMedium color="neutral.c70" size={24} />
          )}
        </Flex>
      </Flex>
    </Touchable>
  );
};

export default PostOnboardingActionRow;

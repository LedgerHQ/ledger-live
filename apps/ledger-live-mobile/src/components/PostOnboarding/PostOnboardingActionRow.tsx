import React, { useCallback } from "react";
import { Flex, Icons, Tag, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import {
  ActionState,
  PostOnboardingAction,
} from "@ledgerhq/live-common/lib/postOnboarding/types";
import Touchable from "../Touchable";

export type Props = PostOnboardingAction & ActionState;

const PostOnboardingActionRow: React.FC<Props> = props => {
  const {
    navigationParams,
    icon: Icon,
    title,
    description,
    tagLabel,
    onStartEvent,
    onStartEventProperties,
    completed,
  } = props;
  const { t } = useTranslation();
  const navigation = useNavigation();

  const handlePress = useCallback(() => {
    if (navigationParams) navigation.navigate(...navigationParams);
  }, [navigationParams, navigation]);

  // TODO: (design) implement Tag component variant in native-ui

  return (
    <Touchable onPress={completed ? null : handlePress}>
      <Flex
        flexDirection="row"
        alignItems="center"
        py="20px"
        justifyContent="space-between"
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
            <Text variant="body" fontWeight="medium" color="neutral.c70">
              {t(description)}
            </Text>
          </Flex>
        </Flex>
        <Flex
          flexDirection="row"
          alignItems="center"
          flexShrink={0}
          flexGrow={1}
          pl={6}
        >
          {tagLabel && (
            <Tag mr={6} size="medium" type="color" uppercase={false}>
              {tagLabel}
            </Tag>
          )}
          {completed ? (
            <Icons.CheckAloneMedium color="success.c100" size={16} />
          ) : (
            <Icons.ChevronRightMedium color="primary.c80" size={16} />
          )}
        </Flex>
      </Flex>
    </Touchable>
  );
};

export default PostOnboardingActionRow;

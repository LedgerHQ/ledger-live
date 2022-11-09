import React, { useCallback } from "react";
import { Flex, Icons, Tag, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import {
  PostOnboardingActionState,
  PostOnboardingAction,
} from "@ledgerhq/types-live";
import Touchable from "../Touchable";
import { track } from "../../analytics";
import {
  BaseNavigationComposite,
  StackNavigatorNavigation,
} from "../RootNavigator/types/helpers";
import { PostOnboardingNavigatorParamList } from "../RootNavigator/types/PostOnboardingNavigator";

export type Props = PostOnboardingAction & PostOnboardingActionState;

const PostOnboardingActionRow: React.FC<Props> = props => {
  const {
    // @ts-expect-error oskour those `any` navigation params are killing us
    navigationParams,
    Icon,
    title,
    description,
    tagLabel,
    startEvent,
    startEventProperties,
    completed,
  } = props;
  const { t } = useTranslation();
  const navigation =
    useNavigation<
      BaseNavigationComposite<
        StackNavigatorNavigation<PostOnboardingNavigatorParamList>
      >
    >();

  const handlePress = useCallback(() => {
    if (navigationParams) {
      navigation.navigate(...navigationParams);
      startEvent && track(startEvent, startEventProperties);
    }
  }, [navigationParams, navigation, startEvent, startEventProperties]);

  return (
    <Touchable onPress={completed ? undefined : handlePress}>
      <Flex
        flexDirection="row"
        alignItems="center"
        py={6}
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
          {tagLabel ? (
            <Tag mr={6} size="medium" type="color" uppercase={false}>
              {tagLabel}
            </Tag>
          ) : null}
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

import React, { useCallback } from "react";
import { Flex, Icons, Tag, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import {
  ActionState,
  PostOnboardingAction,
} from "../../logic/postOnboarding/types";
import { usePostOnboarding } from "../../logic/postOnboarding/hooks";
import Touchable from "../../components/Touchable";

export type Props = PostOnboardingAction & ActionState;

const PostOnboardingActionRow: React.FC<Props> = props => {
  const {
    id,
    navigationParams,
    onPress,
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

  const { setActionDone } = usePostOnboarding();

  const handlePress = useCallback(() => {
    if (navigationParams) navigation.navigate(...navigationParams);
  }, [navigationParams, navigation]);

  // TODO: (design) implement Tag component variant in native-ui
  // TODO: (design) implement title typo in native-ui (large lineheight)
  // TODO: (design) use correct typo from design once it's using design system properly
  // TODO: (logic) implement correct onpress / navigation

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
          <Flex
            ml={6}
            flexDirection="column"
            justifyContent="center"
            flexShrink={1}
          >
            <Text
              variant="large"
              fontWeight="medium"
              color={completed ? "neutral.c70" : "neutral.c100"}
            >
              {t(title)}
            </Text>
            <Text color="neutral.c70" fontWeight="medium">
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
            <Flex mr={6}>
              <Tag active>{tagLabel}</Tag>
            </Flex>
          )}
          {completed ? (
            <Icons.CheckAloneMedium color="success.c100" size={16} />
          ) : (
            <Icons.ChevronRightMedium color="neutral.c80" size={16} />
          )}
        </Flex>
      </Flex>
    </Touchable>
  );
};

export default PostOnboardingActionRow;

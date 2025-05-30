import React, { memo, useCallback } from "react";
import { Flex, Link as TextLink, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import styled from "styled-components/native";
import { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex/index";
import { NavigationProp } from "@react-navigation/native";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

type Props = {
  title: React.ReactNode;
  onSeeAllPress?: () => void;
  navigatorName?: string;
  screenName?: string;
  params?: object | undefined;
  navigation?: NavigationProp<{ [key: string]: object | undefined }>;
  seeMoreText?: React.ReactElement;
  containerProps?: FlexBoxProps;
  testID?: string;
};

const StyledTouchableOpacity = styled.TouchableOpacity.attrs({
  justifyContent: "center",
  alignItems: "flex-end",
  px: 7,
  mx: -7,
  py: 5,
  my: -5,
})``;

const SectionTitle = ({
  title,
  onSeeAllPress,
  navigatorName,
  screenName,
  params,
  navigation,
  seeMoreText,
  containerProps,
  testID,
}: Props) => {
  const { t } = useTranslation();
  const llmAccountListUI = useFeature("llmAccountListUI");
  const onLinkPress = useCallback(() => {
    if (onSeeAllPress) {
      onSeeAllPress();
    }
    if (navigation && navigatorName) {
      navigation.navigate(navigatorName, { screen: screenName, params });
    }
  }, [onSeeAllPress, navigation, navigatorName, screenName, params]);

  return (
    <Flex
      flexDirection={"row"}
      justifyContent={"space-between"}
      alignItems={"center"}
      {...containerProps}
      testID={testID}
    >
      <Text variant="small" fontWeight="semiBold" color="neutral.c70" uppercase flexShrink={1}>
        {title}
      </Text>
      {(onSeeAllPress || navigatorName) && !llmAccountListUI?.enabled ? (
        <StyledTouchableOpacity onPress={onLinkPress}>
          <TextLink onPress={onLinkPress} type={"color"}>
            {seeMoreText || t("common.seeAll")}
          </TextLink>
        </StyledTouchableOpacity>
      ) : null}
    </Flex>
  );
};

export default memo<Props>(SectionTitle);

import React, { memo, useCallback } from "react";
import { Flex, Link as TextLink, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import proxyStyled from "@ledgerhq/native-ui/components/styled";
import { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex/index";
import { NavigationProp } from "@react-navigation/native";

type Props = {
  title: React.ReactNode;
  onSeeAllPress?: () => void;
  navigatorName?: string;
  screenName?: string;
  params?: object | undefined;
  navigation?: NavigationProp<{ [key: string]: object | undefined }>;
  seeMoreText?: React.ReactElement;
  containerProps?: FlexBoxProps;
};

const StyledTouchableOpacity = proxyStyled.TouchableOpacity.attrs({
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
}: Props) => {
  const { t } = useTranslation();
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
    >
      <Text
        variant="small"
        fontWeight="semiBold"
        color="neutral.c70"
        uppercase
        flexShrink={1}
      >
        {title}
      </Text>
      {onSeeAllPress || navigatorName ? (
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

import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { StackHeaderProps } from "@react-navigation/stack";
import { getHeaderTitle } from "@react-navigation/elements";
import { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex/index";
import { NavigationHeaderBackButton } from "./NavigationHeaderBackButton";
import { NavigationHeaderCloseButton } from "./NavigationHeaderCloseButton";

type NavigationHeaderProps = StackHeaderProps & {
  containerProps?: FlexBoxProps;
  hideBack?: boolean;
  onPressClose?: () => void;
  onPressBack?: () => void;
};

function NavigationHeader({
  route,
  options,
  back,
  hideBack,
  containerProps,
  onPressBack,
  onPressClose,
}: NavigationHeaderProps) {
  const { t } = useTranslation();
  const title = t(getHeaderTitle(options, route.name));
  return (
    <Flex
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      py={6}
      mb={5}
      {...containerProps}
    >
      {back && !hideBack ? <NavigationHeaderBackButton onPress={onPressBack} /> : <View />}
      {title.length ? (
        <Text variant="large" fontWeight="semiBold">
          {title}
        </Text>
      ) : null}
      <NavigationHeaderCloseButton onPress={onPressClose} />
    </Flex>
  );
}

export default (props: NavigationHeaderProps) => <NavigationHeader {...props} />;

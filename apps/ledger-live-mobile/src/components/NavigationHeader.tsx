import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { NativeStackHeaderProps } from "@react-navigation/native-stack";
import { getHeaderTitle } from "@react-navigation/elements";
import { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex/index";
import { NavigationHeaderBackButton } from "./NavigationHeaderBackButton";
import { NavigationHeaderCloseButtonAdvanced } from "./NavigationHeaderCloseButton";

type NavigationHeaderProps = NativeStackHeaderProps & {
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
      <NavigationHeaderCloseButtonAdvanced onClose={onPressClose} />
    </Flex>
  );
}

export default (props: NavigationHeaderProps) => <NavigationHeader {...props} />;

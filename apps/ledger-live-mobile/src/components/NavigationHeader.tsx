/* eslint-disable jsx-a11y/anchor-is-valid */
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { ArrowLeftMedium, CloseMedium } from "@ledgerhq/native-ui/assets/icons";
import { Flex, Text, Link } from "@ledgerhq/native-ui";
import { StackHeaderProps } from "@react-navigation/stack";
import { getHeaderTitle } from "@react-navigation/elements";
import { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex";

type NavigationHeaderProps = StackHeaderProps & {
  containerProps?: FlexBoxProps;
  hideBack?: boolean;
};

function NavigationHeader({
  navigation,
  route,
  options,
  back,
  hideBack,
  containerProps,
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
      {back && !hideBack ? (
        // eslint-disable-next-line jsx-a11y/anchor-is-valid
        <Link size="large" Icon={ArrowLeftMedium} onPress={navigation.goBack} />
      ) : (
        <View />
      )}
      {title.length ? (
        <Text variant="large" fontWeight="semiBold">
          {title}
        </Text>
      ) : null}
      <Link
        size="large"
        Icon={CloseMedium}
        onPress={() => {
          navigation.getParent()?.goBack();
        }}
      />
    </Flex>
  );
}

export default (props: NavigationHeaderProps) => (
  <NavigationHeader {...props} />
);

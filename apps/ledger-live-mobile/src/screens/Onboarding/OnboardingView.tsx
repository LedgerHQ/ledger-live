import React from "react";
import { View, TouchableOpacity } from "react-native";
import { useNavigation, StackActions } from "@react-navigation/native";
import { Icons } from "@ledgerhq/native-ui/assets/index";
import { Flex, Text, ScrollListContainer } from "@ledgerhq/native-ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "styled-components/native";

const hitSlop = {
  bottom: 10,
  left: 24,
  right: 24,
  top: 10,
};

type Props = {
  title?: React.ReactNode;
  subTitle?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  hasBackButton?: boolean;
  hasCloseButton?: boolean;
  // eslint-disable-next-line @typescript-eslint/ban-types
  customBackAction?: () => {};
  // eslint-disable-next-line @typescript-eslint/ban-types
  customCloseAction?: () => {};
  centerTitle?: boolean;
};

function OnboardingView({
  title,
  subTitle,
  hasBackButton,
  hasCloseButton,
  customBackAction,
  customCloseAction,
  children,
  footer,
  centerTitle,
}: Props) {
  const { colors } = useTheme();
  const navigation = useNavigation();

  // eslint-disable-next-line consistent-return
  const handlecustomBackAction = () => {
    if (customBackAction) return customBackAction();
    navigation.goBack();
  };

  // eslint-disable-next-line consistent-return
  const handlecustomCloseAction = () => {
    if (customCloseAction) return customCloseAction();
    navigation.dispatch(StackActions.popToTop());
  };

  return (
    <SafeAreaView
      style={[{ flex: 1 }, { backgroundColor: colors.background.main }]}
    >
      {/* HEADER */}
      <Flex mb={8} px={6} pt={8}>
        <Flex
          flexDirection="row"
          justifyContent="space-between"
          mb={subTitle ? 9 : 6}
        >
          <View>
            {hasBackButton ? (
              <TouchableOpacity
                onPress={handlecustomBackAction}
                hitSlop={hitSlop}
              >
                <Icons.ArrowLeftMedium size="24px" />
              </TouchableOpacity>
            ) : null}
          </View>
          <View>
            {hasCloseButton ? (
              <TouchableOpacity
                onPress={handlecustomCloseAction}
                hitSlop={hitSlop}
              >
                <Icons.CloseMedium size="24px" />
              </TouchableOpacity>
            ) : null}
          </View>
        </Flex>

        {/* HEADER TITLES */}
        {title ? (
          <Flex>
            <Text
              variant="h1"
              fontSize={8}
              mb={3}
              textAlign={centerTitle ? "center" : null}
              style={{ textTransform: "uppercase" }}
            >
              {title}
            </Text>
            {subTitle ? (
              <Text variant="body" fontSize={4}>
                {subTitle}
              </Text>
            ) : null}
          </Flex>
        ) : null}
      </Flex>
      <ScrollListContainer flex={1} bg="background.main" mx={6}>
        {/* BODY */}
        {children ? <Flex flex={1}>{children}</Flex> : null}
      </ScrollListContainer>
      {/* FOOTER */}
      {footer ? <Flex>{footer}</Flex> : null}
    </SafeAreaView>
  );
}

export default OnboardingView;

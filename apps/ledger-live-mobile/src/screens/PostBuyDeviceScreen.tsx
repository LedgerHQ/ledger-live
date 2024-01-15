import React, { useCallback, useEffect } from "react";
import { Flex, IconsLegacy, Text, Box } from "@ledgerhq/native-ui";
import styled from "styled-components/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import Button from "~/components/wrappedUi/Button";
import { NavigatorName, ScreenName } from "~/const";
import { setHasOrderedNano, setSensitiveAnalytics } from "~/actions/settings";
import {
  RootNavigationComposite,
  StackNavigatorNavigation,
} from "~/components/RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";

const StyledSafeAreaView = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background.main};
`;

type NavigationProp = RootNavigationComposite<
  StackNavigatorNavigation<BaseNavigatorStackParamList, ScreenName.PostBuyDeviceScreen>
>;

export default function PostBuyDeviceScreen() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation<NavigationProp>();

  const onClose = useCallback(() => {
    navigation.navigate(NavigatorName.Base, {
      screen: NavigatorName.Main,
    });
  }, [navigation]);

  useEffect(() => {
    dispatch(setHasOrderedNano(true));
    dispatch(setSensitiveAnalytics(true));
  }, [dispatch]);

  return (
    <StyledSafeAreaView>
      <Flex flex={1} justifyContent="center" alignItems="center" mx={6} my={6}>
        <Flex justifyContent="center" alignItems="center">
          <Box bg={"success.c30"} p={6} mb={7} borderRadius={999}>
            <Box bg={"success.c20"} p={6} borderRadius={999}>
              <Box
                height={98}
                width={98}
                alignItems={"center"}
                justifyContent={"center"}
                bg={"success.c40"}
                borderRadius={999}
              >
                <IconsLegacy.CheckAloneMedium size="48px" />
              </Box>
            </Box>
          </Box>
          <Text textAlign="center" variant="h4" mb={5}>
            {t("postBuyDevice.title")}
          </Text>
          <Text textAlign="center" variant="bodyLineHeight" color={"neutral.c80"}>
            {t("postBuyDevice.desc")}
          </Text>
        </Flex>
      </Flex>
      <Button mx={6} mb={8} type="main" outline={false} onPress={onClose} size="large">
        {t("common.close")}
      </Button>
    </StyledSafeAreaView>
  );
}

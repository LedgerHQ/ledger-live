import React, { useCallback } from "react";
import {
  Flex,
  Icons,
  Text,
  IconBoxList,
  Link as TextLink,
  Box,
} from "@ledgerhq/native-ui";
import Video from "react-native-video";
import styled, { useTheme } from "styled-components/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Linking, TouchableOpacity } from "react-native";
import Button from "../components/wrappedUi/Button";
import { urls } from "../config/urls";
import { useNavigationInterceptor } from "./Onboarding/onboardingContext";
import { NavigatorName, ScreenName } from "../const";
import useIsAppInBackground from "../components/useIsAppInBackground";
import { completeOnboarding, setReadOnlyMode } from "../actions/settings";
import { useDispatch } from "react-redux";

const hitSlop = {
  bottom: 10,
  left: 24,
  right: 24,
  top: 10,
};

const StyledSafeAreaView = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background.main};
`;

export default function PostBuyDeviceScreen() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  const setupDevice = useCallback(() => {
    dispatch(setReadOnlyMode(true));
    dispatch(completeOnboarding());

      navigation.navigate(NavigatorName.Base, {
        screen: NavigatorName.Main,
      });
  }, [navigation]);

  return (
    <StyledSafeAreaView>
      <Flex
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        width="100%"
        height={48}
        mb={-60}
        zIndex={1}
        p={6}
        pt={9}
      >
        <TouchableOpacity onPress={handleBack} hitSlop={hitSlop}>
          <Icons.ArrowLeftMedium size="24px" />
        </TouchableOpacity>
      </Flex>
      <Flex flex={1} justifyContent="center" alignItems="center" mx={6} my={6}>
        <Flex justifyContent="center" alignItems="center">
          <Box bg={'success.c30'} p={6} mb={7} borderRadius={999}>
            <Box bg={'success.c50'} p={6} borderRadius={999}>
              <Box height={98} width={98} alignItems={'center'} justifyContent={'center'} bg={'success.c80'} borderRadius={999}>
                <Icons.CheckAloneMedium size="48px" />
              </Box>
            </Box>
          </Box>
          <Text textAlign="center" variant="h4" mb={5}>
            {t("postBuyDevice.title")}
          </Text>
          <Text textAlign="center" variant="bodyLineHeight" color={'neutral.c80'}>
            {t("postBuyDevice.desc")}
          </Text>
        </Flex>
      </Flex>
      <Button
        mx={6}
        mb={8}
        type="main"
        outline={false}
        event="BuyDeviceScreen - Buy Ledger"
        onPress={setupDevice}
        size="large"
      >
        {t("common.close")}
      </Button>
    </StyledSafeAreaView>
  );
}

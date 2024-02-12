import React, { useCallback, useState } from "react";
import * as Animatable from "react-native-animatable";
import { useTranslation } from "react-i18next";
import { Flex, Carousel, Text, Button, IconsLegacy } from "@ledgerhq/native-ui";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import styled from "styled-components/native";
import { StyleSheet } from "react-native";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { ScreenName } from "~/const";
import Illustration from "~/images/illustration/Illustration";

import { normalize } from "~/helpers/normalizeSize";

import ForceTheme from "~/components/theme/ForceTheme";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";

const StyledSafeAreaView = styled(SafeAreaView)`
  flex: 1;
  background-color: ${p => p.theme.colors.constant.purple};
  padding: 16px;
`;

const images = {
  light: [
    require("~/images/illustration/Light/_049.png"),
    require("~/images/illustration/Light/_073.png"),
    require("~/images/illustration/Light/_070.png"),
    require("~/images/illustration/Light/_069.png"),
    require("~/images/illustration/Light/_066.png"),
  ],
};

type NavigationProps = StackNavigatorProps<
  OnboardingNavigatorParamList,
  ScreenName.OnboardingModalSetupNewDevice
>;

type CardType = { index: number; deviceModelId: DeviceModelId };
const Card = ({ index /* , deviceModelId */ }: CardType) => {
  const { t } = useTranslation();
  return (
    <Flex flex={1} justifyContent="center" alignItems="center" px={20}>
      <Flex mb={8}>
        <Illustration
          size={normalize(240)}
          darkSource={images.light[index]}
          lightSource={images.light[index]}
        />
      </Flex>
      <Text
        variant="h2"
        mb={3}
        textAlign="center"
        color="constant.black"
        lineHeight="34.8px"
        testID={`onboarding-stepNewDevice-title${index}`}
      >
        {t(`onboarding.stepNewDevice.${index}.title`)}
      </Text>
      <Text textAlign="center" variant="bodyLineHeight" color="constant.black">
        {t(`onboarding.stepNewDevice.${index}.desc`)}
      </Text>
    </Flex>
  );
};

const FooterNextButton = ({ label }: { label: string }) => {
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const route = useRoute<NavigationProps["route"]>();

  const next = useCallback(() => {
    navigation.navigate(ScreenName.OnboardingSetNewDevice, { ...route.params });
  }, [navigation, route.params]);

  return (
    <Button type="main" size="large" onPress={next}>
      {label}
    </Button>
  );
};

const FooterActions = new Map();
FooterActions.set(4, FooterNextButton);

const Footer = ({ index }: { index: number }) => {
  const { t } = useTranslation();

  const Component = FooterActions.get(index);
  if (!Component) return null;

  return (
    <Animatable.View
      style={styles.animatable}
      animation="fadeIn"
      useNativeDriver
      testID="onboarding-stepNewDevice-cta"
    >
      <Component label={t(`onboarding.stepNewDevice.cta`)} />
    </Animatable.View>
  );
};

function OnboardingStepNewDevice() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const route = useRoute<NavigationProps["route"]>();
  const navigation = useNavigation<NavigationProps["navigation"]>();
  const { deviceModelId } = route.params;
  const { t } = useTranslation();
  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  return (
    <StyledSafeAreaView>
      <Flex
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        width="100%"
        height={48}
      >
        <Button
          Icon={() => <IconsLegacy.ArrowLeftMedium color="constant.black" size={24} />}
          onPress={handleBack}
          style={styles.backArrow}
        />
        <Text variant="h3" mb={3} textAlign="center" color="constant.black">
          {t(`onboarding.stepNewDevice.${currentIndex}.label`)}
        </Text>
      </Flex>
      <ForceTheme selectedPalette={"light"}>
        <Carousel onChange={setCurrentIndex}>
          {new Array(5).fill(null).map((_, index) => (
            <Card index={index} key={index} deviceModelId={deviceModelId} />
          ))}
        </Carousel>

        <Flex minHeight="60px" width="100%" justifyContent="center" alignItems="center">
          <Footer index={currentIndex} />
        </Flex>
      </ForceTheme>
    </StyledSafeAreaView>
  );
}

const styles = StyleSheet.create({
  animatable: {
    width: "100%",
  },
  backArrow: {
    position: "absolute",
    top: -5,
    left: 0,
  },
});

export default OnboardingStepNewDevice;

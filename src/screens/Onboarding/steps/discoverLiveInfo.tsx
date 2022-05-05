import React, { useCallback, useState } from "react";
import * as Animatable from "react-native-animatable";
import { useTranslation } from "react-i18next";
import { Flex, Carousel, Text, Button, Icons } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import styled from "styled-components/native";
import { useDispatch } from "react-redux";
import { completeOnboarding } from "../../../actions/settings";
import { useNavigationInterceptor } from "../onboardingContext";

import { NavigatorName } from "../../../const";
import Illustration from "../../../images/illustration/Illustration";

import { DeviceNames } from "../types";

const StyledSafeAreaView = styled(SafeAreaView)`
  flex: 1;
  background-color: ${p => p.theme.colors.background.main};
  padding: 16px;
`;

const images = {
  light: [
    require("../../../images/illustration/Light/_069.png"),
    require("../../../images/illustration/Light/_073.png"),
    require("../../../images/illustration/Light/_049.png"),
  ],
  dark: [
    require("../../../images/illustration/Dark/_069.png"),
    require("../../../images/illustration/Dark/_073.png"),
    require("../../../images/illustration/Dark/_049.png"),
  ],
};

type CardType = { index: number; deviceModelId: DeviceNames };
const Card = ({ index }: CardType) => {
  const { t } = useTranslation();
  return (
    <Flex flex={1} justifyContent="center" alignItems="center" px={20}>
      <Flex mb={10}>
        <Illustration
          size={248}
          darkSource={images.dark[index]}
          lightSource={images.light[index]}
        />
      </Flex>
      <Text variant="h2" mb={3} style={{ textTransform: "uppercase" }}>
        {t(`onboarding.discoverLive.${index}.title`)}
      </Text>
      <Text textAlign="center" variant="body">
        {t(`onboarding.discoverLive.${index}.desc`)}
      </Text>
    </Flex>
  );
};

const FooterNextButton = ({ label }: { label: string }) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { resetCurrentStep } = useNavigationInterceptor();

  function next(): void {
    dispatch(completeOnboarding());
    resetCurrentStep();

    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.popToTop();
    }

    // TODO: FIX @react-navigation/native using Typescript
    // @ts-ignore next-line
    navigation.replace(NavigatorName.Base, {
      screen: NavigatorName.Main,
    });
  }

  return (
    <Button type="main" size="large" onPress={next}>
      {label}
    </Button>
  );
};

const FooterActions = new Map();
FooterActions.set(2, FooterNextButton);

const Footer = ({ index }: { index: number }) => {
  const { t } = useTranslation();

  const Component = FooterActions.get(index);
  if (!Component) return null;

  return (
    <Animatable.View animation="fadeIn" useNativeDriver>
      <Component label={t(`onboarding.discoverLive.${index}.cta`)} />
    </Animatable.View>
  );
};

function DiscoverLiveInfo() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigation = useNavigation();

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  return (
    <StyledSafeAreaView>
      <Flex
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        width="100%"
        height={48}
      >
        <Button Icon={Icons.ArrowLeftMedium} onPress={handleBack} />
      </Flex>
      <Carousel onChange={setCurrentIndex}>
        {new Array(3).fill(null).map((_, index) => (
          <Card index={index} key={index} />
        ))}
      </Carousel>
      <Flex minHeight="13%" justifyContent="center" alignItems="center">
        <Footer index={currentIndex} />
      </Flex>
    </StyledSafeAreaView>
  );
}

export default DiscoverLiveInfo;

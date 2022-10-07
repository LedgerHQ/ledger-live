import React, { useCallback, useState } from "react";
import * as Animatable from "react-native-animatable";
import { useTranslation } from "react-i18next";
import { Flex, Carousel, Text, Button, Icons } from "@ledgerhq/native-ui";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import styled from "styled-components/native";
import { ScreenName } from "../../../const";
import Illustration from "../../../images/illustration/Illustration";

import { normalize } from "../../../helpers/normalizeSize";

import { DeviceNames } from "../types";

const StyledSafeAreaView = styled(SafeAreaView)`
  flex: 1;
  background-color: ${p => p.theme.colors.constant.purple};
  padding: 16px;
`;

const images = {
  light: [
    require("../../../images/illustration/Light/_049.png"),
    require("../../../images/illustration/Light/_073.png"),
    require("../../../images/illustration/Light/_070.png"),
    require("../../../images/illustration/Light/_069.png"),
    require("../../../images/illustration/Light/_066.png"),
  ],
};

type CardType = { index: number; deviceModelId: DeviceNames };
const Card = ({ index /* , deviceModelId */ }: CardType) => {
  const { t } = useTranslation();
  return (
    <Flex flex={1} justifyContent="center" alignItems="center" px={20}>
      <Flex>
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
      >
        {t(`onboarding.stepNewDevice.${index}.title`)}
      </Text>
      <Text textAlign="center" variant="body" color="constant.black">
        {t(`onboarding.stepNewDevice.${index}.desc`)}
      </Text>
    </Flex>
  );
};

const FooterNextButton = ({ label }: { label: string }) => {
  const navigation = useNavigation();
  const route = useRoute();

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
      style={{ width: "100%" }}
      animation="fadeIn"
      useNativeDriver
    >
      <Component label={t(`onboarding.stepNewDevice.cta`)} />
    </Animatable.View>
  );
};

type CurrentRouteType = RouteProp<
  { params: { deviceModelId: DeviceNames } },
  "params"
>;

function OnboardingStepNewDevice() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const route = useRoute<CurrentRouteType>();
  const navigation = useNavigation();
  const { deviceModelId } = route.params;

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
        {new Array(5).fill(null).map((_, index) => (
          <Card index={index} key={index} deviceModelId={deviceModelId} />
        ))}
      </Carousel>
      <Flex
        minHeight="60px"
        width="100%"
        justifyContent="center"
        alignItems="center"
      >
        <Footer index={currentIndex} />
      </Flex>
    </StyledSafeAreaView>
  );
}

export default OnboardingStepNewDevice;

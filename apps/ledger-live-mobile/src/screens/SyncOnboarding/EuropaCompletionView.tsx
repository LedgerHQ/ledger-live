import Animation from "~/components/Animation";
import React from "react";
import { Dimensions, Image } from "react-native";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Flex } from "@ledgerhq/native-ui";
import OnboardingSuccessAnimation from "~/animations/onboardingSuccess.json";

type Props = {
  device: Device;
  onAnimationFinish: () => void;
};

const EuropaCompletionView: React.FC<Props> = ({ onAnimationFinish }) => {
  const { height: screenHeight, width: screenWidth } = Dimensions.get("screen");

  return (
    <Flex height="100%" width="100%">
      <Animation
        source={OnboardingSuccessAnimation}
        onAnimationFinish={onAnimationFinish}
        loop={false}
        style={{
          position: "absolute",
          zIndex: 0,
          top: -screenHeight / 2,
          left: -screenWidth / 2,
          right: 0,
          bottom: 0,
          height: screenHeight * 2,
          width: screenWidth * 2,
        }}
      />
      <Flex flex={1} alignItems="center" justifyContent="center">
        <Image
          source={require("./assets/europa-success.png")}
          style={{ zIndex: 1, width: 275 }}
          resizeMode="contain"
        />
      </Flex>
    </Flex>
  );
};

export default EuropaCompletionView;

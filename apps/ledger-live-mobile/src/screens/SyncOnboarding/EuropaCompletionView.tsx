import Animation from "~/components/Animation";
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, Image } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import { useLottieAsset } from "~/utils/lottieAsset";

const onboardingSuccessAsset = require("~/animations/onboardingSuccess.lottie.json");
import { useIsFocused } from "@react-navigation/core";

type Props = {
  onAnimationFinish?: () => void;
  loop: boolean;
};

const redirectDelay = 2500;

const EuropaCompletionView: React.FC<Props> = ({ onAnimationFinish, loop }) => {
  const { height: screenHeight, width: screenWidth } = Dimensions.get("screen");
  const isFocused = useIsFocused();
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasBeenFocused, setHasBeenFocused] = useState<boolean>(false);
  const OnboardingSuccessAnimation = useLottieAsset(onboardingSuccessAsset);

  useEffect(() => {
    if (!hasBeenFocused && isFocused) {
      setHasBeenFocused(true);
    }
  }, [hasBeenFocused, isFocused, setHasBeenFocused]);

  useEffect(() => {
    if (onAnimationFinish) {
      delayRef.current = setTimeout(onAnimationFinish, redirectDelay);
    }

    return () => {
      if (delayRef.current) {
        clearTimeout(delayRef.current);
        delayRef.current = null;
      }
    };
  }, [onAnimationFinish]);

  return (
    <Flex height="100%" width="100%">
      {hasBeenFocused && (
        <Animation
          source={OnboardingSuccessAnimation}
          loop={loop}
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
      )}
      <Flex flex={1} alignItems="center" justifyContent="center">
        <Image
          source={require("./assets/europa-success.webp")}
          style={{ zIndex: 1, width: 275 }}
          resizeMode="contain"
        />
      </Flex>
    </Flex>
  );
};

export default EuropaCompletionView;

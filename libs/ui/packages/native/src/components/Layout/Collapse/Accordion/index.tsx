import React, { useEffect } from "react";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
} from "react-native-reanimated";
import Link, { LinkProps } from "../../../cta/Link";
import { ChevronBottomMedium, ChevronTopMedium } from "@ledgerhq/icons-ui/nativeLegacy";
import { View } from "react-native";

type AccordionProps = {
  collapsed?: boolean;
  children: React.ReactNode;
  title: string;
  onPress: LinkProps["onPress"];
};

const Accordion = ({
  collapsed = false,
  children,
  title,
  onPress,
}: AccordionProps): React.ReactElement => {
  const animationHeight = useSharedValue(collapsed ? "0%" : "100%");

  const config = {
    duration: 500,
    easing: Easing.bezier(0.5, 0.01, 0, 1),
  };

  const style = useAnimatedStyle(() => {
    return {
      maxHeight: withTiming(animationHeight.value, config) as unknown as number, // patch for
    };
  });

  useEffect(() => {
    if (collapsed) {
      animationHeight.value = "0%";
    } else {
      animationHeight.value = "100%";
    }
  }, [animationHeight, collapsed]);

  return (
    <View>
      <Link onPress={onPress} Icon={collapsed ? ChevronBottomMedium : ChevronTopMedium}>
        {title}
      </Link>
      <Animated.View
        style={[
          {
            overflow: "hidden",
          },
          style,
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
};

export default Accordion;

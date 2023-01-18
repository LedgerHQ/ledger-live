import React, { useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import { Flex, Button, Switch, Tag } from "@ledgerhq/native-ui";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { Layout, SlideInLeft } from "react-native-reanimated";
import useAnalyticsEventsLog from "./useAnalyticsEventsLog";
import Event from "./Event";

const AnimatedFlex = Animated.createAnimatedComponent(Flex);

type ListProps = {
  showExtraProps: boolean;
};

const EventList: React.FC<ListProps> = ({ showExtraProps }) => {
  const { items } = useAnalyticsEventsLog();
  return (
    <AnimatedFlex flexDirection="column-reverse">
      {items.map(item => {
        const isLast =
          Math.abs(
            item.date.getTime() - items[items.length - 1].date.getTime(),
          ) < 1000;
        return (
          <AnimatedFlex key={item.id} layout={Layout} entering={SlideInLeft}>
            <Event {...item} showExtraProps={showExtraProps} isLast={isLast} />
          </AnimatedFlex>
        );
      })}
    </AnimatedFlex>
  );
};

const AnalyticsConsole = () => {
  const render = useEnv("ANALYTICS_CONSOLE");
  const [solid, setSolid] = useState(false);
  const [showExtraProps, setShowExtraProps] = useState(false);
  if (!render) return null;
  return (
    <Flex
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      flex={1}
      zIndex={999}
      opacity={solid ? 1 : 0.4}
      bg={solid ? "white" : "#fffc"}
      pointerEvents={solid ? "auto" : "none"}
    >
      <SafeAreaView>
        {solid ? (
          <Flex>
            <Switch
              checked={showExtraProps}
              onChange={setShowExtraProps}
              label="show extra props"
            />
          </Flex>
        ) : null}
        <EventList showExtraProps={showExtraProps} />
      </SafeAreaView>
    </Flex>
  );
};

export default AnalyticsConsole;

import React from "react";
import { ScrollView, Text } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import Animated, { Layout, SlideInLeft } from "react-native-reanimated";
import usePerformanceReportsLog from "./usePerformanceReportsLog";
import Event from "./Event";
import TextInput from "../TextInput";
import Clipboard from "@react-native-clipboard/clipboard";
import Button from "../Button";

const AnimatedFlex = Animated.createAnimatedComponent(Flex);

type ListProps = {
  showExtraProps: boolean;
};

const EventList: React.FC<ListProps> = ({ showExtraProps }) => {
  const { items } = usePerformanceReportsLog();
  const copyToClipboard = () => {
    console.log(items);
  };

  return (
    <ScrollView>
      <Button onPress={copyToClipboard}>Copy to clipboard</Button>
      <AnimatedFlex paddingBottom={200} flexDirection="column-reverse">
        {items.map(item => {
          const isLast =
            Math.abs(item.date.getTime() - items[items.length - 1].date.getTime()) < 1000;
          return (
            <AnimatedFlex key={item.report.reportId} layout={Layout} entering={SlideInLeft}>
              <Event
                report={item.report}
                date={item.date}
                showExtraProps={showExtraProps}
                isLast={isLast}
              />
            </AnimatedFlex>
          );
        })}
      </AnimatedFlex>
    </ScrollView>
  );
};

export default EventList;

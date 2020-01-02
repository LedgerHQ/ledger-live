import React, { memo, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  FlatList,
} from "react-native";
import Animated, { Easing } from "react-native-reanimated";
import LText from "./LText";
import Chevron from "../icons/Chevron";
import colors from "../colors";

const {
  cond,
  set,
  block,
  clockRunning,
  startClock,
  timing,
  Clock,
  Value,
  interpolate,
  eq,
  defined,
  and,
} = Animated;

const runCollapse = (clock, value, dest) => {
  const state = {
    finished: new Value(0),
    position: new Value(0),
    time: new Value(0),
    frameTime: new Value(0),
  };

  const config = {
    duration: new Value(200),
    toValue: new Value(1),
    easing: Easing.inOut(Easing.quad),
  };

  return block([
    // if clock running reset timer and switch position
    cond(clockRunning(clock), 0, [
      set(state.finished, 0),
      set(state.time, 0),
      set(state.frameTime, 0),
      set(state.position, value),
      set(config.toValue, dest),
      startClock(clock),
    ]),
    // run clock
    timing(clock, state, config),
    state.position,
  ]);
};

const renderListItem = ({ item, index }: *) => <View key={index}>{item}</View>;
const keyExtractor = (_, index) => String(index);

type Props = {
  title: string,
  data: Array<*>,
  itemHeight: number,
  renderItem: Function,
  containerStyle?: *,
};

const CollapsibleList = ({
  title,
  containerStyle,
  data,
  itemHeight,
  renderItem,
  ...props
}: Props) => {
  const [isOpen, setOpen] = useState(undefined);
  const onPress = useCallback(() => {
    setOpen(!isOpen);
  }, [setOpen, isOpen]);

  const clock = new Clock();
  const [openState] = useState(new Value(0));
  const openingAnim = cond(
    and(defined(isOpen), eq(isOpen, false)),
    [
      // opening
      set(openState, runCollapse(clock, openState, 1)),
      openState,
    ],
    [
      // closing
      set(openState, runCollapse(clock, openState, 0)),
      openState,
    ],
  );

  const height = interpolate(openingAnim, {
    inputRange: [0, 1],
    outputRange: [0, 15 + itemHeight * data.length],
  });

  const rotateZ = interpolate(openingAnim, {
    inputRange: [0, 1],
    outputRange: [-Math.PI / 2, 0],
  });

  return (
    <View style={[styles.root, containerStyle]}>
      <TouchableWithoutFeedback onPress={onPress}>
        <View style={styles.toggleButton}>
          <Animated.View
            style={[styles.chevronIcon, { transform: [{ rotateZ }] }]}
          >
            <Chevron size={10} color={colors.live} />
          </Animated.View>
          <LText style={styles.toggleButtonText}>{title}</LText>
        </View>
      </TouchableWithoutFeedback>
      <Animated.View style={{ height, opacity: openingAnim }}>
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          {...props}
        />
      </Animated.View>
    </View>
  );
};

CollapsibleList.defaultProps = {
  itemHeight: 46,
  renderItem: renderListItem,
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.lightGrey,
    borderRadius: 3,
    paddingHorizontal: 15,
  },
  toggleButton: {
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  chevronIcon: {
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  toggleButtonText: {
    color: colors.live,
    fontSize: 13,
  },
});

export default memo(CollapsibleList);

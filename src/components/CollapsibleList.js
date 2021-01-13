import React, { memo, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  FlatList,
} from "react-native";
import Animated, { Easing } from "react-native-reanimated";
import { useTheme } from "@react-navigation/native";
import LText from "./LText";
import Chevron from "../icons/Chevron";

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
} = Animated;

/**
 * @param {Animated.Clock} clock animation clock
 * @param {Animated.Value} value current position
 * @param {Animated.Value} dest position to interpolate to
 * @returns {Animated.Node<number>}
 */
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
      // reset running state
      set(state.finished, 0),
      // reset time
      set(state.time, 0),
      // reset frame time count
      set(state.frameTime, 0),
      // set current anim position
      set(state.position, value),
      // set new anim destination
      set(config.toValue, dest),
      // start clock animation
      startClock(clock),
    ]),
    // run clock timing
    timing(clock, state, config),
    // return anim position
    state.position,
  ]);
};

const renderListItem = ({ item, index }: *) => <View key={index}>{item}</View>;
const keyExtractor = (_, index) => String(index);

const OPEN = 1;
const CLOSE = 2;

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
  const { colors } = useTheme();
  const [isOpen, setOpen] = useState(CLOSE);
  const onPress = useCallback(() => {
    setOpen(isOpen !== OPEN ? OPEN : CLOSE);
  }, [setOpen, isOpen]);

  // animation clock
  const clock = new Clock();
  // animation Open state
  const [openState] = useState(new Value(0));
  // animation opening anim node
  const openingAnim = cond(
    eq(isOpen, OPEN),
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

  // interpolated height from opening anim state for list container
  const height = interpolate(openingAnim, {
    inputRange: [0, 1],
    outputRange: [itemHeight, 61 + itemHeight * data.length],
  });

  // interpolated rotation from opening anim state for chevron icon
  const rotateZ = interpolate(openingAnim, {
    inputRange: [0, 1],
    outputRange: [-Math.PI / 2, 0],
  });

  const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

  return (
    <Animated.View
      style={[
        styles.root,
        { height, backgroundColor: colors.card },
        containerStyle,
      ]}
    >
      <TouchableWithoutFeedback onPress={onPress}>
        <View style={styles.toggleButton}>
          <Animated.View
            style={[styles.chevronIcon, { transform: [{ rotateZ }] }]}
          >
            <Chevron size={10} color={colors.live} />
          </Animated.View>
          <LText style={styles.toggleButtonText} color="live">
            {title}
          </LText>
        </View>
      </TouchableWithoutFeedback>
      <AnimatedFlatList
        style={{ opacity: openingAnim }}
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsVerticalScrollIndicator={false}
        {...props}
      />
    </Animated.View>
  );
};

CollapsibleList.defaultProps = {
  itemHeight: 46,
  renderItem: renderListItem,
};

const styles = StyleSheet.create({
  root: {
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
    fontSize: 13,
  },
});

export default memo(CollapsibleList);

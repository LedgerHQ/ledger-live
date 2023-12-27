import React, { memo, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  FlatList,
  StyleProp,
  ViewStyle,
  ListRenderItem,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@react-navigation/native";
import LText from "./LText";
import Chevron from "~/icons/Chevron";

const renderListItem = <T extends React.ReactNode>({ item, index }: { item: T; index: number }) => (
  <View key={index}>{item}</View>
);

const keyExtractor = <T,>(_: T, index: number) => String(index);

const OPEN = 1;
const CLOSE = 2;

type Props<T> = {
  title: React.ReactNode;
  data: Array<T>;
  itemHeight: number;
  renderItem: ListRenderItem<T>;
  containerStyle?: StyleProp<ViewStyle>;
};

const CollapsibleList = <T,>({
  title,
  containerStyle,
  data,
  itemHeight,
  renderItem,
  ...props
}: Props<T>) => {
  const { colors } = useTheme();
  const [isOpen, setOpen] = useState(CLOSE);
  const onPress = useCallback(() => {
    setOpen(isOpen !== OPEN ? OPEN : CLOSE);
  }, [setOpen, isOpen]);

  // Reanimated value representing the open state of collapsing list: 0: collapsed, 1: opened
  const openState = useSharedValue(0);

  // Reacts to a change on isOpen
  useAnimatedReaction(
    () => {
      return isOpen === OPEN;
    },
    checkResult => {
      if (checkResult) {
        // Opening the collapsing list: 0 -> 1
        openState.value = withTiming(1, {
          duration: 200,
        });
      } else {
        // Collapsing the list: 1 -> 0
        openState.value = withTiming(0, {
          duration: 200,
        });
      }
    },
  );

  // Animated style updating the height depending on the opening anim state of the list container
  const heightStyle = useAnimatedStyle(() => {
    return {
      height: interpolate(openState.value, [0, 1], [itemHeight, 61 + itemHeight * data.length]),
    };
  });

  const opacityStyle = useAnimatedStyle(() => ({
    opacity: openState.value,
  }));

  // Animated style applying a rotate transform whose value depends on the opening anim state of the list container
  const rotateZStyle = useAnimatedStyle(() => {
    const value = interpolate(openState.value, [0, 1], [-Math.PI / 2, 0]);

    return {
      transform: [
        {
          rotateZ: `${value}rad`,
        },
      ],
    };
  });

  const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

  return (
    <Animated.View
      style={[
        styles.root,
        {
          backgroundColor: colors.card,
        },
        containerStyle,
        heightStyle,
      ]}
    >
      <TouchableWithoutFeedback onPress={onPress}>
        <View style={styles.toggleButton}>
          <Animated.View style={[styles.chevronIcon, rotateZStyle]}>
            <Chevron size={10} color={colors.live} />
          </Animated.View>
          <LText style={styles.toggleButtonText} color="live">
            {title}
          </LText>
        </View>
      </TouchableWithoutFeedback>
      <AnimatedFlatList
        style={opacityStyle}
        data={data}
        renderItem={renderItem as ListRenderItem<unknown>}
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
export default memo(CollapsibleList) as unknown as typeof CollapsibleList;

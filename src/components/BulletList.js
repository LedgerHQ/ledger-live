// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet, Animated } from "react-native";

import Icon from "react-native-vector-icons/dist/Feather";
import { useTheme } from "@react-navigation/native";
import LText from "./LText";
import Circle from "./Circle";

// TODO fade in animation

export class Bullet extends PureComponent<{ children: *, big?: boolean }> {
  render() {
    const { children, big } = this.props;
    return (
      <View style={[styles.bulletContainer, big && styles.bulletContainerBig]}>
        <LText style={[styles.number, big && styles.numberBig]} color="live">
          {children}
        </LText>
      </View>
    );
  }
}

export class BulletItemText extends PureComponent<{
  children: React$Node,
  style?: *,
}> {
  render() {
    return (
      <LText style={[styles.text, this.props.style]} color="smoke">
        {this.props.children}
      </LText>
    );
  }
}

export class BulletItem extends PureComponent<{
  value: React$Node | (() => React$Node),
  index: number,
  animated?: boolean,
  itemContainerStyle?: *,
  itemStyle?: *,
  itemTextStyle?: *,
  Bullet: React$ComponentType<*>,
}> {
  static defaultProps = {
    Bullet,
  };
  opacity = new Animated.Value(this.props.animated ? 0 : 1);

  componentDidMount() {
    if (this.props.animated) {
      Animated.timing(this.opacity, {
        toValue: 1,
        duration: 500,
        delay: this.props.index * 800,
        useNativeDriver: true,
      }).start();
    }
  }

  render() {
    const {
      index,
      value,
      Bullet,
      itemContainerStyle,
      itemStyle,
      itemTextStyle,
    } = this.props;
    const { opacity } = this;

    return (
      <Animated.View style={[styles.item, { opacity }, itemContainerStyle]}>
        <Bullet>{index + 1}</Bullet>
        <View style={itemStyle || styles.textContainer}>
          {typeof value === "function" ? (
            value()
          ) : (
            <BulletItemText style={itemTextStyle}>{value}</BulletItemText>
          )}
        </View>
      </Animated.View>
    );
  }
}

export function BulletChevron() {
  const { colors } = useTheme();
  return (
    <View style={styles.chevron}>
      <Icon size={16} name="chevron-right" color={colors.grey} />
    </View>
  );
}

export function BulletGreenCheck() {
  const { colors } = useTheme();
  return (
    <Circle size={24} bg={colors.ledgerGreen}>
      <Icon size={16} name="check" color={colors.white} />
    </Circle>
  );
}

class BulletList extends PureComponent<{
  list: *,
  animated?: boolean,
  Bullet: React$ComponentType<*>,
  itemContainerStyle?: *,
  itemStyle?: *,
  style?: *,
}> {
  static defaultProps = {
    Bullet,
  };
  render() {
    const {
      list,
      animated,
      Bullet,
      itemContainerStyle,
      itemStyle,
      style,
    } = this.props;
    return (
      <View style={style}>
        {list.map((value, index) => (
          <BulletItem
            itemContainerStyle={itemContainerStyle}
            itemStyle={itemStyle}
            Bullet={Bullet}
            animated={animated}
            key={index}
            index={index}
            value={value}
          />
        ))}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  item: {
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  bulletContainer: {
    width: 24,
    height: 24,
    backgroundColor: "#eff3fd",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  bulletContainerBig: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  number: {
    fontSize: 12,
  },
  numberBig: {
    fontSize: 16,
  },
  chevron: { alignSelf: "flex-start", paddingTop: 2 },
  textContainer: {
    flexShrink: 1,
    flexGrow: 1,
    paddingLeft: 16,
  },
  text: {
    fontSize: 14,
    lineHeight: 21,
  },
});

export default BulletList;

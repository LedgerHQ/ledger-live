// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet, Animated } from "react-native";

import LText from "./LText";
import colors from "../colors";

// TODO fade in animation

export class BulletItemText extends PureComponent<{
  children: React$Node,
}> {
  render() {
    return <LText style={styles.text}>{this.props.children}</LText>;
  }
}

export class BulletItem extends PureComponent<{
  value: React$Node | (() => React$Node),
  index: number,
  animated?: boolean,
}> {
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
    const { index, value } = this.props;
    const { opacity } = this;
    return (
      <Animated.View style={[styles.item, { opacity }]}>
        <Bullet>{index + 1}</Bullet>
        <View style={styles.textContainer}>
          {typeof value === "function" ? (
            value()
          ) : (
            <BulletItemText>{value}</BulletItemText>
          )}
        </View>
      </Animated.View>
    );
  }
}

class BulletList extends PureComponent<{
  list: *,
  animated?: boolean,
}> {
  render() {
    const { list, animated } = this.props;
    return (
      <View>
        {list.map((value, index) => (
          <BulletItem
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

export class Bullet extends PureComponent<{ children: *, big?: boolean }> {
  render() {
    const { children, big } = this.props;
    return (
      <View style={[styles.bulletContainer, big && styles.bulletContainerBig]}>
        <LText style={[styles.number, big && styles.numberBig]} tertiary>
          {children}
        </LText>
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
    color: colors.live,
  },
  numberBig: {
    fontSize: 16,
  },
  textContainer: {
    flexShrink: 1,
    flexGrow: 1,
    paddingLeft: 16,
  },
  text: {
    color: colors.smoke,
    fontSize: 14,
    lineHeight: 21,
  },
});

export default BulletList;

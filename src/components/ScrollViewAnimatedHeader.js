// @flow

import React, { Component, Fragment } from "react";
import { Animated } from "react-native";

type Props = {
  children: React$Node,
  title: React$Element<any>,
  header: React$Element<any>,
};

type State = {
  scrollY: Object,
};

/**
 * @name ScrollViewAnimatedHeader
 * @desc this components takes a `title` and `header` props
 * and animated them as a response to scroll event. Both
 * `title` and `header` need to be `Animated.[element]`
 * @prop chidren React.Node - children to render
 * @prop title React.Element - the text that needs to be animated on scroll
 * @prop header React.Element - the header/image that needs to be animated on scroll
 *
 * We can customize even more the animation when we have final designs
 * eg: opacity, colors, sizes...
 */
export default class ScrollViewAnimatedHeader extends Component<Props, State> {
  state = {
    scrollY: new Animated.Value(0),
  };

  render() {
    const { children, title, header } = this.props;

    const headerTranslateY = this.state.scrollY.interpolate({
      inputRange: [0, 90],
      outputRange: [0, -90],
      extrapolate: "clamp",
    });

    const headerScale = this.state.scrollY.interpolate({
      inputRange: [-200, 0],
      outputRange: [1.5, 1],
      extrapolate: "clamp",
    });

    const textScale = this.state.scrollY.interpolate({
      inputRange: [0, 90],
      outputRange: [1, 0.5],
      extrapolate: "clamp",
    });

    const textTranslateY = this.state.scrollY.interpolate({
      inputRange: [0, 90],
      outputRange: [0, 15],
      extrapolate: "clamp",
    });

    return (
      <Fragment>
        <Animated.ScrollView
          contentContainerStyle={{ marginTop: 150 }}
          scrollEventThrottle={16}
          onScroll={Animated.event([
            {
              nativeEvent: {
                contentOffset: {
                  y: this.state.scrollY,
                },
              },
            },
          ])}
        >
          {children}
        </Animated.ScrollView>
        {React.cloneElement(
          header,
          {
            style: {
              ...header.props.style,
              transform: [
                { translateY: headerTranslateY },
                { scale: headerScale },
              ],
            },
          },
          React.cloneElement(title, {
            style: {
              ...title.props.style,
              transform: [{ translateY: textTranslateY }, { scale: textScale }],
            },
          }),
        )}
      </Fragment>
    );
  }
}

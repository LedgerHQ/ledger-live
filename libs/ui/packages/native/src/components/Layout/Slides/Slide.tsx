import React from "react";
import { StyleSheet, View } from "react-native";

const SlideComponent = (props: React.ComponentProps<typeof View>) => {
  return <View {...props} style={[styles.slide, props.style]} />;
};

const styles = StyleSheet.create({
  slide: {
    flex: 1,
  },
});

export function Slide(props: React.ComponentProps<typeof SlideComponent>) {
  return <SlideComponent {...props} />;
}

export type SlideElement = React.ReactElement<
  React.ComponentPropsWithoutRef<typeof Slide>,
  typeof Slide
>;

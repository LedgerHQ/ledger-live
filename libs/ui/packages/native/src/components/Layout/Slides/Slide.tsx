import React, { useCallback } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import { useSlideContext, useSlidesContext } from "./context";

const SlideComponent = (props: React.ComponentProps<typeof View>) => {
  return <View {...props} style={[styles.slide, props.style]} />;
};

export function SlideBody(props: React.ComponentProps<typeof View>) {
  return <View {...props} style={[styles.body, props.style]} />;
}

export function SlideFooter(props: React.ComponentProps<typeof View>) {
  const { setFooterHeight } = useSlidesContext();
  const { slideIndex } = useSlideContext();

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout;
      setFooterHeight(slideIndex, height);
    },
    [setFooterHeight, slideIndex],
  );

  return <View {...props} style={[styles.footer, props.style]} onLayout={handleLayout} />;
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  footer: {
    paddingBottom: 16,
  },
});

export function Slide(props: React.ComponentProps<typeof SlideComponent>) {
  return <SlideComponent {...props} />;
}

Slide.Body = SlideBody;
Slide.Footer = SlideFooter;

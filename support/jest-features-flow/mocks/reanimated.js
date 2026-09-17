const React = require("react");

function AnimatedView(props) {
  return React.createElement("View", props, props.children);
}

function useSharedValue(initial) {
  return {
    value: initial,
    get() {
      return this.value;
    },
    set(next) {
      this.value = typeof next === "function" ? next(this.value) : next;
    },
  };
}

function useAnimatedStyle(updater) {
  return updater();
}

function withTiming(toValue) {
  return toValue;
}

function interpolate(value, input, output) {
  if (value <= input[0]) return output[0];
  return output[output.length - 1];
}

const Easing = {
  cubic: t => t,
  inOut: easing => easing,
};

module.exports = {
  __esModule: true,
  default: { View: AnimatedView },
  Easing,
  FadeIn: { duration: () => ({}) },
  FadeInUp: { duration: () => ({}) },
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
};

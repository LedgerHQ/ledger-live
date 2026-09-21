const React = require("react");

function AnimatedView(props) {
  return React.createElement("View", props, props.children);
}

function useSharedValue(initialValue) {
  return React.useRef({ value: initialValue }).current;
}

module.exports = {
  __esModule: true,
  default: { View: AnimatedView },
  FadeIn: { duration: () => ({}) },
  FadeInUp: { duration: () => ({}) },
  runOnJS: fn => fn,
  useAnimatedStyle: factory => factory(),
  useSharedValue,
};

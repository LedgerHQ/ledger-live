const React = require("react");

function AnimatedView(props) {
  return React.createElement("View", props, props.children);
}

function makeMutable(initial) {
  return { value: initial };
}

function useSharedValue(initial) {
  const ref = React.useRef(makeMutable(initial));
  return ref.current;
}

function useAnimatedStyle(factory) {
  return factory();
}

function passthroughValue(value) {
  return value;
}

module.exports = {
  __esModule: true,
  default: { View: AnimatedView },
  FadeIn: { duration: () => ({}) },
  FadeInUp: { duration: () => ({}) },
  LinearTransition: { duration: () => ({}) },
  makeMutable,
  useSharedValue,
  useAnimatedStyle,
  withSpring: passthroughValue,
  withTiming: passthroughValue,
};

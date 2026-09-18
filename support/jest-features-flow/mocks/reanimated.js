const React = require("react");

function AnimatedView(props) {
  return React.createElement("View", props, props.children);
}

module.exports = {
  __esModule: true,
  default: { View: AnimatedView },
  FadeIn: { duration: () => ({}) },
  FadeInUp: { duration: () => ({}) },
};

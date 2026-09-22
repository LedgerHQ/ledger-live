const React = require("react");

function GestureDetector(props) {
  return props.children ?? null;
}

function createChainablePanGesture() {
  const gesture = {
    enabled: () => gesture,
    activateAfterLongPress: () => gesture,
    onStart: () => gesture,
    onUpdate: () => gesture,
    onEnd: () => gesture,
    onFinalize: () => gesture,
  };
  return gesture;
}

module.exports = {
  __esModule: true,
  Gesture: {
    Pan: createChainablePanGesture,
  },
  GestureDetector,
  GestureHandlerRootView: function GestureHandlerRootView(props) {
    return React.createElement("View", props, props.children);
  },
};

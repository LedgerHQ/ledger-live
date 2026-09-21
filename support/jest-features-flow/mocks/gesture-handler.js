const React = require("react");

const CALLBACKS = ["onStart", "onUpdate", "onEnd", "onFinalize"];
const CONFIG = ["activeOffsetY", "failOffsetX"];

function createGesture() {
  const gesture = { callbacks: {}, isEnabled: true };

  for (const name of CALLBACKS) {
    gesture[name] = callback => {
      gesture.callbacks[name] = callback;
      return gesture;
    };
  }
  for (const name of CONFIG) {
    gesture[name] = () => gesture;
  }
  gesture.enabled = isEnabled => {
    gesture.isEnabled = isEnabled;
    return gesture;
  };

  return gesture;
}

function GestureDetector({ gesture, children }) {
  const child = React.Children.only(children);
  if (!gesture.isEnabled) return child;

  return React.cloneElement(child, {
    onPanStart: gesture.callbacks.onStart,
    onPanUpdate: gesture.callbacks.onUpdate,
    onPanEnd: gesture.callbacks.onEnd,
    onPanFinalize: gesture.callbacks.onFinalize,
  });
}

module.exports = {
  __esModule: true,
  Gesture: { Pan: createGesture },
  GestureDetector,
};

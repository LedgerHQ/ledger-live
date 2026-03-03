/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Mock for @sbaiahmed1/react-native-blur used during E2E (Detox) builds.
 *
 * BlurView's UIViewPropertyAnimator sets an NSNull delegate on CAAnimation,
 * which crashes DetoxSync's animation tracking on iOS.
 * Replacing native blur components with plain Views avoids the crash while
 * keeping the rest of the UI intact.
 */
const React = require("react");
const { View } = require("react-native");

const passthrough = React.forwardRef((props, ref) => {
  const { style, children } = props;
  return React.createElement(View, { ref, style }, children);
});

passthrough.displayName = "BlurViewMock";

module.exports = {
  BlurView: passthrough,
  VibrancyView: passthrough,
  LiquidGlassView: passthrough,
  LiquidGlassContainer: passthrough,
  ProgressiveBlurView: passthrough,
  BlurSwitch: passthrough,
  default: passthrough,
};

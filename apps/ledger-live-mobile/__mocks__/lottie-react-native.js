const React = require("react");
const { View } = require("react-native");

const LottieView = props => React.createElement(View, props);
LottieView.displayName = "LottieView";

module.exports = LottieView;
module.exports.default = LottieView;

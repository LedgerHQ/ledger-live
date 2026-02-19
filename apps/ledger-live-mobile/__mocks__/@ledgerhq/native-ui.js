const React = require("react");
const { Text: RNText, View } = require("react-native");

const Text = React.forwardRef(({ children, testID, ...props }, ref) =>
  React.createElement(RNText, { testID, ref, ...props }, children),
);
Text.displayName = "Text";

const IconsLegacy = new Proxy(
  {},
  {
    get: (_, name) => {
      const IconComponent = props =>
        React.createElement(View, { testID: `icon-${String(name)}`, ...props });
      IconComponent.displayName = `Icon.${String(name)}`;
      return IconComponent;
    },
  },
);

const Icons = new Proxy(
  {},
  {
    get: (_, name) => {
      const IconComponent = props =>
        React.createElement(View, { testID: `icon-${String(name)}`, ...props });
      IconComponent.displayName = `Icon.${String(name)}`;
      return IconComponent;
    },
  },
);

const Flex = React.forwardRef(({ children, ...props }, ref) =>
  React.createElement(View, { ref, ...props }, children),
);
Flex.displayName = "Flex";

const Box = React.forwardRef(({ children, ...props }, ref) =>
  React.createElement(View, { ref, ...props }, children),
);
Box.displayName = "Box";

const Button = ({ children, onPress, testID, ...props }) =>
  React.createElement(
    require("react-native").TouchableOpacity,
    { onPress, testID, ...props },
    typeof children === "string"
      ? React.createElement(RNText, null, children)
      : children,
  );

const Log = ({ children, ...props }) =>
  React.createElement(RNText, props, children);

module.exports = {
  Text,
  IconsLegacy,
  Icons,
  Flex,
  Box,
  Button,
  Log,
  Tag: View,
  Alert: View,
  Switch: View,
  ProgressBar: View,
  InfiniteLoader: View,
  Checkbox: View,
  Radio: View,
};

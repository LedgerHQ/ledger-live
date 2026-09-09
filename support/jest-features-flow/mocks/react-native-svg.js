const React = require("react");

// react-native-svg's entry reads RN internals (`Touchable`) that mocks/react-native.js does not
// stub, so importing the real package throws. Every export becomes a host element named after
// the SVG tag (Path -> "Path"), keeping RNTL queries on testID and accessibility props working.
const svgElement = name =>
  function SvgElement({ children, ...props }) {
    return React.createElement(name, props, children);
  };

const Svg = svgElement("Svg");

module.exports = new Proxy(
  { __esModule: true, default: Svg, Svg },
  {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop !== "string") return undefined;
      return svgElement(prop);
    },
  },
);

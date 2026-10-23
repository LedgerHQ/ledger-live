// react-native-svg's entry reads RN internals (`Touchable`) that mocks/react-native.js does not
// stub, so importing the real package throws. Every export is a string host named after the SVG
// tag (Path -> "Path"), matching mocks/react-native.js (View: "View") so RNTL queries on
// testID and accessibility props keep working and the element type stays stable across renders.
const svgElement = name => name;

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

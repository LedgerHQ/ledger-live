const React = require("react");

// Generic Lumen (native) stub: every named export becomes a host element named after the
// component (e.g. Text -> "Text"), so React Native Testing Library text queries still work.
module.exports = new Proxy(
  { __esModule: true },
  {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop !== "string") return undefined;
      return ({ children, ...props }) => React.createElement(prop, props, children);
    },
  },
);

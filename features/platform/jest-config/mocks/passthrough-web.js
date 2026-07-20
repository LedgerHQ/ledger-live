const React = require("react");

// Generic Lumen (web) stub: every named export becomes a component that renders its
// children in a fragment. Redirected here via moduleNameMapper, so adding new Lumen
// components requires no test-config changes and no peer installs.
module.exports = new Proxy(
  { __esModule: true },
  {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop !== "string") return undefined;
      return ({ children }) => React.createElement(React.Fragment, null, children);
    },
  },
);

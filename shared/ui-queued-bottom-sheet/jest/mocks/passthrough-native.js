const React = require("react");

function Banner({ children, description, primaryAction, secondaryAction, ...props }) {
  return React.createElement(
    "Banner",
    { ...props, description, primaryAction, secondaryAction },
    description === undefined ? null : React.createElement("Text", undefined, description),
    children,
    primaryAction,
    secondaryAction,
  );
}

function Button({ children, ...props }) {
  return React.createElement(
    "Button",
    props,
    typeof children === "string" || typeof children === "number"
      ? React.createElement("Text", undefined, children)
      : children,
  );
}

// Local copy of the flow jest Lumen passthrough (see @support/jest-features-flow). Kept in-package
// so `require("react")` resolves from this workspace (contacts-style: no per-test lumen mocks).
module.exports = new Proxy(
  { __esModule: true, Banner, Button },
  {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop !== "string") return undefined;
      if (prop.startsWith("use")) {
        return () => ({ current: null });
      }
      return ({ children, ...props }) => React.createElement(prop, props, children);
    },
  },
);

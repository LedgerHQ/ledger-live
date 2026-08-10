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

// Generic Lumen (native) stub: every named export becomes a host element named after the
// component (e.g. Text -> "Text"), so React Native Testing Library text queries still work.
// Hooks (`use*`) return a mutable ref stub. Redirected here via moduleNameMapper — no
// per-component mocks, no peer installs.
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

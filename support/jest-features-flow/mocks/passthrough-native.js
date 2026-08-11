const React = require("react");

// RNTL text queries only look at "Text" host elements, so any bare string rendered by a
// component that is not itself Text has to be wrapped to stay queryable.
function wrapTextChildren(children) {
  if (typeof children === "string" || typeof children === "number") {
    return React.createElement("Text", undefined, children);
  }
  if (Array.isArray(children)) {
    return children.map((child, index) =>
      typeof child === "string" || typeof child === "number"
        ? React.createElement("Text", { key: `text-${index}` }, child)
        : child,
    );
  }
  return children;
}

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

// Generic Lumen (native) stub: every named export becomes a host element named after the
// component (e.g. Text -> "Text"), so React Native Testing Library text queries still work.
// Hooks (`use*`) return a mutable ref stub. Redirected here via moduleNameMapper — no
// per-component mocks, no peer installs.
module.exports = new Proxy(
  { __esModule: true, Banner },
  {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop !== "string") return undefined;
      if (prop.startsWith("use")) {
        return () => ({ current: null });
      }
      if (prop === "Text") {
        return ({ children, ...props }) => React.createElement("Text", props, children);
      }
      return ({ children, ...props }) =>
        React.createElement(prop, props, wrapTextChildren(children));
    },
  },
);

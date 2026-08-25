const React = require("react");

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

// The generic @support/jest-features-flow native stub renders Banner's description as visible
// Text but not its title (features/flow Banners don't set one). InfoState always sets both, so
// this override adds title too and keeps everything else identical to the shared stub.
function Banner({ children, title, description, primaryAction, secondaryAction, ...props }) {
  return React.createElement(
    "Banner",
    { ...props, title, description, primaryAction, secondaryAction },
    title === undefined ? null : React.createElement("Text", undefined, title),
    description === undefined ? null : React.createElement("Text", undefined, description),
    children,
    primaryAction,
    secondaryAction,
  );
}

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

const React = require("react");

// The generic @support/jest-features-flow passthrough stub doesn't special-case Banner on the
// web side (only on native), so title/description render as DOM attributes instead of visible
// text. Override it locally with a stub that renders them, keep the same generic fallback for
// everything else this package actually renders (Button, Spot).
function Banner({ title, description, ...props }) {
  return React.createElement(
    "div",
    props,
    title === undefined ? null : React.createElement("h4", undefined, title),
    description === undefined ? null : React.createElement("p", undefined, description),
  );
}

function createPassthroughComponent() {
  return function LumenStub({ children, ...props }) {
    if (props.onClick !== undefined) {
      return React.createElement("button", { type: "button", ...props }, children);
    }

    return React.createElement("div", props, children);
  };
}

module.exports = new Proxy(
  { __esModule: true, Banner },
  {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop !== "string") return undefined;
      return createPassthroughComponent();
    },
  },
);

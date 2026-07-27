const React = require("react");

function createPassthroughComponent() {
  return function LumenStub({ children, ...props }) {
    if (props.onChange !== undefined && props.value !== undefined) {
      return React.createElement("input", props);
    }

    if (props.onClick !== undefined) {
      return React.createElement("button", { type: "button", ...props }, children);
    }

    return React.createElement("div", props, children);
  };
}

// Generic Lumen (web) stub: every named export becomes a component that forwards props
// to a minimal DOM node so tests can query data-testid and fire events.
module.exports = new Proxy(
  { __esModule: true },
  {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop !== "string") return undefined;
      return createPassthroughComponent();
    },
  },
);

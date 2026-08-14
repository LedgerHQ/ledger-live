const React = require("react");

function InteractiveIcon({ icon: _icon, iconType: _iconType, size: _size, ...props }) {
  return React.createElement("button", { type: "button", ...props });
}

function Tooltip({ children }) {
  return React.createElement(React.Fragment, undefined, children);
}

function TooltipTrigger({ children }) {
  return React.createElement(React.Fragment, undefined, children);
}

function TooltipContent({ children, ...props }) {
  return React.createElement("div", { ...props, role: "tooltip" }, children);
}

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
  { __esModule: true, InteractiveIcon, Tooltip, TooltipContent, TooltipTrigger },
  {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop !== "string") return undefined;
      return createPassthroughComponent();
    },
  },
);

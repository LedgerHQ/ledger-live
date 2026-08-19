const React = require("react");
const TooltipOpenContext = React.createContext();

function resolveAvatarColor(identifier) {
  return `avatar-color:${identifier}`;
}

// Render the header's close button so tests can query getByRole("button", { name: /close/i }).
function DialogHeader({ title, onClose }) {
  return React.createElement(
    "div",
    undefined,
    title === undefined ? null : React.createElement("h2", undefined, title),
    React.createElement("button", { type: "button", "aria-label": "Close", onClick: onClose }),
  );
}

function Avatar(avatarProps) {
  const { alt, fallbackColor, fallbackText, size = "md", ...props } = avatarProps;
  const hasAriaLabel = Object.hasOwn(avatarProps, "aria-label");
  const hasRole = Object.hasOwn(avatarProps, "role");

  return React.createElement(
    "div",
    {
      ...props,
      role: hasRole ? avatarProps.role : "img",
      "aria-label": hasAriaLabel ? avatarProps["aria-label"] : alt,
      "data-fallback-color": fallbackColor,
      "data-size": size,
    },
    fallbackText,
  );
}

function InteractiveIcon({ icon: _icon, iconType: _iconType, size: _size, ...props }) {
  return React.createElement("button", { type: "button", ...props });
}

function Tooltip({ children, onOpenChange, open }) {
  return React.createElement(
    TooltipOpenContext.Provider,
    { value: open },
    React.createElement(
      "div",
      {
        "data-open": String(open),
        onMouseEnter: () => onOpenChange?.(true),
        onMouseLeave: () => onOpenChange?.(false),
        onFocus: () => onOpenChange?.(true),
        onBlur: () => onOpenChange?.(false),
      },
      children,
    ),
  );
}

function TooltipTrigger({ children }) {
  return React.createElement(React.Fragment, undefined, children);
}

function TooltipContent({ children, ...props }) {
  if (React.useContext(TooltipOpenContext) === false) return null;

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
  {
    __esModule: true,
    Avatar,
    DialogHeader,
    InteractiveIcon,
    resolveAvatarColor,
    Tooltip,
    TooltipContent,
    TooltipTrigger,
  },
  {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop !== "string") return undefined;
      return createPassthroughComponent();
    },
  },
);

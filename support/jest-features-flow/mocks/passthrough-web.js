const React = require("react");
const TooltipOpenContext = React.createContext();
const DialogOpenContext = React.createContext();

function resolveAvatarColor(identifier) {
  return `avatar-color:${identifier}`;
}

// The real Dialog keeps its content out of the DOM while closed, so consumers can assert on
// `queryByTestId(...)` being absent. `Dialog` only publishes `open` (no DOM node of its own) and
// `DialogContent` opts out of rendering when closed, mirroring the Tooltip stubs below.
function Dialog({ children, open }) {
  return React.createElement(DialogOpenContext.Provider, { value: open }, children);
}

function DialogContent({ children, ...props }) {
  if (React.useContext(DialogOpenContext) === false) return null;

  return React.createElement("div", props, children);
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

// Text passed through props (Banner's title/description, Tag's label) has to be rendered as
// children to be queryable, but the props must stay on the node too: consumer tests assert on
// them (e.g. `toHaveAttribute("label", …)`), which the generic stub below supported.
function Banner({ children, title, description, ...props }) {
  return React.createElement(
    "div",
    { ...props, title, description },
    title === undefined ? null : React.createElement("span", undefined, title),
    description === undefined ? null : React.createElement("span", undefined, description),
    children,
  );
}

function Tag({ label, children, ...props }) {
  return React.createElement("span", { ...props, label }, label, children);
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

// One component per export name: the CJS interop re-reads `exports.TextInput` on every render, so
// handing back a fresh function each time would change the element type and remount the DOM node —
// controlled inputs would then lose focus and drop every keystroke but the first.
const passthroughComponents = new Map();

function getPassthroughComponent(name) {
  const cached = passthroughComponents.get(name);
  if (cached !== undefined) return cached;

  const component = createPassthroughComponent();
  component.displayName = name;
  passthroughComponents.set(name, component);
  return component;
}

// Generic Lumen (web) stub: every named export becomes a component that forwards props
// to a minimal DOM node so tests can query data-testid and fire events.
module.exports = new Proxy(
  {
    __esModule: true,
    Avatar,
    Banner,
    Dialog,
    DialogContent,
    DialogHeader,
    InteractiveIcon,
    Tag,
    resolveAvatarColor,
    Tooltip,
    TooltipContent,
    TooltipTrigger,
  },
  {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop !== "string") return undefined;
      return getPassthroughComponent(prop);
    },
  },
);

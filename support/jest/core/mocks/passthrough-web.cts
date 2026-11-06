const React = require("react");
const TooltipOpenContext = React.createContext();
const DialogOpenContext = React.createContext();
const PopoverOpenContext = React.createContext();
const SelectContext = React.createContext();

function resolveAvatarColor(identifier) {
  return `avatar-color:${identifier}`;
}

// Closed dialogs render nothing, matching the real Dialog. `height` is forwarded as `data-height`.
function Dialog({ children, open, height }) {
  return React.createElement(DialogOpenContext.Provider, { value: { open, height } }, children);
}

function DialogContent({ children, ...props }) {
  const { open, height } = React.useContext(DialogOpenContext) ?? {};
  if (open === false) return null;

  return React.createElement(
    "div",
    height === undefined ? props : { ...props, "data-height": height },
    children,
  );
}

// Render the header's back and close buttons so tests can query them by their real Lumen labels.
function DialogHeader({ title, description, onBack, onClose }) {
  return React.createElement(
    "div",
    undefined,
    onBack === undefined
      ? null
      : React.createElement("button", { type: "button", "aria-label": "Go back", onClick: onBack }),
    title === undefined ? null : React.createElement("h2", undefined, title),
    description === undefined ? null : React.createElement("p", undefined, description),
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

function IconButton({ icon: _icon, size: _size, ...props }) {
  return React.createElement("button", { type: "button", ...props });
}

// Text passed through props (Banner's title/description, Tag's label) has to be rendered as
// children to be queryable, but the props must stay on the node too: consumer tests assert on
// them (e.g. `toHaveAttribute("label", …)`), which the generic stub below supported.
// Banner actions are elements: they are rendered, like in the native stub, not set as attributes.
function Banner({ children, title, description, primaryAction, secondaryAction, ...props }) {
  return React.createElement(
    "div",
    { ...props, title, description },
    title === undefined ? null : React.createElement("span", undefined, title),
    description === undefined ? null : React.createElement("span", undefined, description),
    children,
    primaryAction,
    secondaryAction,
  );
}

function Tag({ label, children, ...props }) {
  return React.createElement("span", { ...props, label }, label, children);
}

// `MenuTrigger` takes its trigger element through `render`, not through children, so the generic
// stub would drop it and the consumer's button would never reach the DOM.
function MenuTrigger({ render, children, ...props }) {
  if (React.isValidElement(render)) return React.cloneElement(render, props);

  return React.createElement("button", { type: "button", ...props }, children);
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

function Popover({ children, open }) {
  return React.createElement(PopoverOpenContext.Provider, { value: open }, children);
}

function PopoverTrigger({ render, children }) {
  if (typeof render === "function") {
    return render({});
  }
  if (React.isValidElement(render)) {
    return render;
  }
  return React.createElement(React.Fragment, undefined, children);
}

function PopoverContent({ children, ...props }) {
  if (React.useContext(PopoverOpenContext) === false) return null;

  return React.createElement("div", props, children);
}

function TooltipContent({ children, ...props }) {
  if (React.useContext(TooltipOpenContext) === false) return null;

  return React.createElement("div", { ...props, role: "tooltip" }, children);
}

// The Select takes its trigger and its items through render props, which the generic stub would
// drop. `Select` publishes its items and selection; `SelectList` always renders the items, like
// `PopoverContent` without `open`, and picking one reports it through `onValueChange`.
function Select({ children, items, value, onValueChange }) {
  return React.createElement(
    SelectContext.Provider,
    { value: { items: items ?? [], value, onValueChange } },
    children,
  );
}

function SelectTrigger({ render, children }) {
  if (typeof render === "function") return render({});
  return React.createElement(React.Fragment, undefined, children);
}

function SelectList({ renderItem, className }) {
  const { items } = React.useContext(SelectContext);
  return React.createElement("div", { className, role: "listbox" }, items.map(renderItem));
}

function SelectItem({ children, value, className }) {
  const select = React.useContext(SelectContext);
  return React.createElement(
    "div",
    {
      className,
      role: "option",
      "aria-selected": select.value === value,
      onClick: () => select.onValueChange?.(value),
    },
    children,
  );
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
    IconButton,
    InteractiveIcon,
    MenuTrigger,
    Tag,
    resolveAvatarColor,
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    Popover,
    PopoverContent,
    PopoverTrigger,
    Select,
    SelectItem,
    SelectList,
    SelectTrigger,
  },
  {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop !== "string") return undefined;
      return getPassthroughComponent(prop);
    },
  },
);

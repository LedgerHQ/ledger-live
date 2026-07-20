const React = require("react");

const DOM_PROP_NAMES = new Set([
  "alt",
  "className",
  "disabled",
  "href",
  "id",
  "name",
  "onBlur",
  "onChange",
  "onClick",
  "onFocus",
  "onKeyDown",
  "onKeyUp",
  "onMouseEnter",
  "onMouseLeave",
  "onSubmit",
  "placeholder",
  "role",
  "src",
  "tabIndex",
  "title",
  "type",
  "value",
]);

function getDomProps(props) {
  return Object.fromEntries(
    Object.entries(props).filter(
      ([name]) => DOM_PROP_NAMES.has(name) || name.startsWith("aria-") || name.startsWith("data-"),
    ),
  );
}

// Generic Lumen (web) stub: every named export becomes a simple element that forwards
// DOM-facing props. Redirected here via moduleNameMapper, so adding new Lumen components
// requires no test-config changes and no peer installs.
module.exports = new Proxy(
  { __esModule: true },
  {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (typeof prop !== "string") return undefined;

      const Component = ({
        children,
        as = "div",
        appearance: _appearance,
        density: _density,
        height: _height,
        icon: _icon,
        onClose: _onClose,
        onOpenChange: _onOpenChange,
        open: _open,
        size: _size,
        ...props
      }) => React.createElement(as, getDomProps(props), children);

      target[prop] = Component;
      return Component;
    },
  },
);

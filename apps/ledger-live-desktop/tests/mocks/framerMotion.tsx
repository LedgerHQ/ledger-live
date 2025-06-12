import React from "react";

const motion = new Proxy(
  {},
  {
    get: (_target, prop) => {
      const Comp = React.forwardRef(function Comp(props, ref) {
        // Only allow string props (HTML tags), fallback to 'div' for symbols
        const tag = typeof prop === "string" ? prop : "div";
        return React.createElement(
          tag,
          Object.assign({}, typeof props === "object" && props !== null ? props : {}, { ref }),
        );
      });
      Comp.displayName = typeof prop === "string" ? prop : "motionComponent";
      return Comp;
    },
  },
);

function AnimatePresence(props: { children?: React.ReactNode }) {
  return <>{props.children}</>;
}

export { motion, AnimatePresence };

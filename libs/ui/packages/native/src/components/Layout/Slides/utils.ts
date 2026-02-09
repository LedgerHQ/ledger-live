import React from "react";

export function isElementOfType<C extends React.JSXElementConstructor<any>>(
  child: React.ReactNode,
  component: C,
): child is React.ReactElement<React.ComponentPropsWithoutRef<C>, C> {
  return React.isValidElement(child) && child.type === component;
}

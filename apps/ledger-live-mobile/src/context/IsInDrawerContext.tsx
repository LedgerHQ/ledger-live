import React from "react";

const defaultValue = { isInDrawer: false };
const valueForDrawers = { isInDrawer: true };

/**
 * This context allows all the descendants to know if they are inside a drawer.
 *
 * This should be used to wrap all children of any drawer:
 * ```
 * <IsInDrawerContext.Provider value={{ isInDrawer: true }}>
 *   {children}
 * </IsInDrawerContext.Provider>
 * ```
 * */
const IsInDrawerContext = React.createContext<{ isInDrawer?: boolean }>(defaultValue);

export const IsInDrawerProvider: React.FC<{ children: React.ReactNode | null }> = ({
  children,
}) => {
  return (
    <IsInDrawerContext.Provider value={valueForDrawers}>{children}</IsInDrawerContext.Provider>
  );
};

export default IsInDrawerContext;

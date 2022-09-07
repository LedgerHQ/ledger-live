import React from "react";

/**
 * The value of the context defines whether or not
 * currency values should be hidden in discreet mode.
 */
const DiscreetModeContext = React.createContext(false);

export default DiscreetModeContext;

type Props = {
  shouldApplyDiscreetMode?: boolean;
  children: React.ReactNode;
};

/**
 * Wrap a component in this provider to decide whether or not currency values
 * should be hidden when discreet mode is enabled.
 */
export function DiscreetModeProvider({
  /**
   * Set this to true to hide all children currency values when discreet mode
   * is enabled.
   */
  shouldApplyDiscreetMode = false,
  children,
}: Props) {
  return (
    <DiscreetModeContext.Provider value={shouldApplyDiscreetMode}>
      {children}
    </DiscreetModeContext.Provider>
  );
}

/**
 * Higher order component that wraps a component in the `DiscreetModeProvider`.
 * Using this HOC for a given component will make all currency values hidden
 * by default when discreet mode is on.
 */
export function withDiscreetMode<T>(
  Component: React.ComponentType<T>,
  shouldApplyDiscreetMode = true,
) {
  return (props: T) => (
    <DiscreetModeProvider shouldApplyDiscreetMode={shouldApplyDiscreetMode}>
      <Component {...props} />
    </DiscreetModeProvider>
  );
}

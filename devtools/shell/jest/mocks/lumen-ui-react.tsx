import React from "react";

export const ThemeProvider = ({ children }: { children?: React.ReactNode }) => <>{children}</>;

export const Divider = () => <hr />;

export const Button = ({
  children,
  onClick,
  "aria-label": ariaLabel,
  "aria-expanded": ariaExpanded,
  "aria-current": ariaCurrent,
}: {
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  "aria-label"?: string;
  "aria-expanded"?: boolean;
  "aria-current"?: "page" | undefined;
}) => (
  <button
    onClick={onClick}
    aria-label={ariaLabel}
    aria-expanded={ariaExpanded}
    aria-current={ariaCurrent}
  >
    {children}
  </button>
);

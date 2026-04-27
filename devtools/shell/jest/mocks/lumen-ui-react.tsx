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

export const SearchInput = ({
  value,
  onChange,
  placeholder,
  "data-testid": testId,
}: {
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  "data-testid"?: string;
}) => (
  <input
    type="search"
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    data-testid={testId}
  />
);

export const ListItem = ({
  children,
  onClick,
  className,
  "aria-current": ariaCurrent,
}: {
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  className?: string;
  "aria-current"?: "page" | undefined;
}) => (
  <div role="button" onClick={onClick} className={className} aria-current={ariaCurrent}>
    {children}
  </div>
);

export const ListItemLeading = ({ children }: { children?: React.ReactNode }) => <>{children}</>;

export const ListItemContent = ({ children }: { children?: React.ReactNode }) => <>{children}</>;

export const ListItemTitle = ({ children }: { children?: React.ReactNode }) => (
  <span>{children}</span>
);

export const ListItemDescription = ({ children }: { children?: React.ReactNode }) => (
  <span>{children}</span>
);

export const ListItemTrailing = ({ children }: { children?: React.ReactNode }) => <>{children}</>;

export const Tag = ({
  label,
}: {
  label: string;
  appearance?: string;
  size?: string;
  className?: string;
}) => <span>{label}</span>;

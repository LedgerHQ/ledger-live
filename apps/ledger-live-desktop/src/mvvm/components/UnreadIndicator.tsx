import React from "react";

type UnreadIndicatorProps = {
  readonly className?: string;
};

export function UnreadIndicator({ className = "pointer-events-none" }: UnreadIndicatorProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="8"
      height="8"
      viewBox="0 0 8 8"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
      data-testid="unread-indicator"
    >
      <circle cx="4" cy="4" r="4" fill="var(--text-active)" />
    </svg>
  );
}

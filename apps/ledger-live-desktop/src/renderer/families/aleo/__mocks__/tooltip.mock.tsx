import React from "react";

const ToolTip = ({
  content,
  enabled = true,
  children,
}: {
  content?: React.ReactNode;
  enabled?: boolean;
  children?: React.ReactNode;
}) => (
  <div
    data-testid="tooltip"
    data-tooltip={enabled && typeof content === "string" ? content : undefined}
  >
    {children}
  </div>
);

export default ToolTip;

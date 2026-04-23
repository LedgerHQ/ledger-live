import React from "react";

export const Chip = ({
  children,
  onClick,
  dataTestId,
}: {
  children: React.ReactNode;
  onClick: () => void;
  dataTestId?: string;
}) => {
  return (
    <button
      type="button"
      className="px-8 py-4 rounded-sm body-2 text-base flex items-center justify-center bg-muted cursor-pointer"
      onClick={onClick}
      data-testid={dataTestId}
    >
      {children}
    </button>
  );
};

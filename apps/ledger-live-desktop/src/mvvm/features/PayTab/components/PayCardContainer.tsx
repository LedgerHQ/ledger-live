import React from "react";

interface PayCardContainerProps {
  readonly children?: React.ReactNode;
}

export default function PayCardContainer({ children }: PayCardContainerProps) {
  return (
    <div
      data-testid="pay-card-container"
      className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-muted-subtle"
    >
      {children}
    </div>
  );
}

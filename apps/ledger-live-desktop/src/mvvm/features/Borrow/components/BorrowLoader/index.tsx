import React from "react";
import BigSpinner from "~/renderer/components/BigSpinner";

interface BorrowLoaderProps {
  isLoading: boolean;
}

export function BorrowLoader({ isLoading }: Readonly<BorrowLoaderProps>) {
  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <BigSpinner size={50} />
    </div>
  );
}

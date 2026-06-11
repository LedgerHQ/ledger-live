import React from "react";
import { Spinner } from "@ledgerhq/lumen-ui-react";

interface BorrowLoaderProps {
  isLoading: boolean;
}

export function BorrowLoader({ isLoading }: Readonly<BorrowLoaderProps>) {
  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <Spinner size={48} />
    </div>
  );
}
